import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLlmsTxtCandidates,
  buildAiRequestBody,
  DEFAULT_AI_RENAME_SETTINGS,
  extractAiResponseText,
  getHostPermissionPattern,
  normalizeAiEndpoint,
  parseAiRenameSettings,
  resolveAiEndpointCandidates,
  sanitizeGeneratedTitle,
  selectPageContent,
} from '../../src/utils/aiConfig.ts';

test('旧 AI 设置缺少 reasoning effort 时补成 medium', () =>
{
  const settings = parseAiRenameSettings(JSON.stringify({
    baseUrl: 'https://example.com/v1',
    apiKey: 'key',
    model: 'model',
    protocol: 'auto',
    prompt: 'prompt',
    autoRename: false,
  }));
  assert.equal(settings.reasoningEffort, 'medium');
  assert.equal(DEFAULT_AI_RENAME_SETTINGS.reasoningEffort, 'medium');
});

test('Responses 请求使用 100 max output tokens 和 reasoning 对象', () =>
{
  const body = buildAiRequestBody(
    { ...DEFAULT_AI_RENAME_SETTINGS, model: 'model', reasoningEffort: 'high' },
    'responses',
    'prompt'
  );
  assert.deepEqual(body, {
    model: 'model',
    input: 'prompt',
    max_output_tokens: 100,
    reasoning: { effort: 'high' },
  });
});

test('Chat Completions 请求使用 100 max completion tokens 和 reasoning_effort', () =>
{
  const body = buildAiRequestBody(
    { ...DEFAULT_AI_RENAME_SETTINGS, model: 'model', reasoningEffort: 'low' },
    'chat-completions',
    'prompt'
  );
  assert.deepEqual(body, {
    model: 'model',
    messages: [{ role: 'user', content: 'prompt' }],
    max_completion_tokens: 100,
    reasoning_effort: 'low',
  });
});

test('Reasoning effort 为 None 时不发送推理字段', () =>
{
  const settings = { ...DEFAULT_AI_RENAME_SETTINGS, model: 'model', reasoningEffort: 'off' as const };
  assert.equal('reasoning' in buildAiRequestBody(settings, 'responses', 'prompt'), false);
  assert.equal('reasoning_effort' in buildAiRequestBody(settings, 'chat-completions', 'prompt'), false);
});

test('为 OpenAI 根地址补上 v1 Responses endpoint', () =>
{
  assert.equal(
    normalizeAiEndpoint('https://api.openai.com', 'responses'),
    'https://api.openai.com/v1/responses'
  );
});
test('为已有 v1 的地址追加 Chat Completions endpoint', () =>
{
  assert.equal(
    normalizeAiEndpoint('https://example.com/openai/v1/', 'chat-completions'),
    'https://example.com/openai/v1/chat/completions'
  );
});

test('完整 endpoint 不重复追加并保留 query', () =>
{
  assert.equal(
    normalizeAiEndpoint('https://example.com/v1/responses?api-version=2026-01-01', 'responses'),
    'https://example.com/v1/responses?api-version=2026-01-01'
  );
});

test('显式协议可以替换完整 URL 中的另一种 endpoint', () =>
{
  assert.equal(
    normalizeAiEndpoint('https://example.com/v1/responses', 'chat-completions'),
    'https://example.com/v1/chat/completions'
  );
});

test('Auto 从完整 Responses endpoint 推断协议', () =>
{
  assert.deepEqual(
    resolveAiEndpointCandidates('https://example.com/v1/responses', 'auto'),
    [{ protocol: 'responses', url: 'https://example.com/v1/responses' }]
  );
});

test('Auto 对 Base URL 依次返回 Responses 和 Chat Completions', () =>
{
  assert.deepEqual(
    resolveAiEndpointCandidates('https://example.com/v1', 'auto'),
    [
      { protocol: 'responses', url: 'https://example.com/v1/responses' },
      { protocol: 'chat-completions', url: 'https://example.com/v1/chat/completions' },
    ]
  );
});

test('拒绝非 HTTP URL', () =>
{
  assert.throws(() => normalizeAiEndpoint('file:///tmp/api', 'responses'), /HTTP or HTTPS/);
});

test('拒绝 URL 中的账号密码', () =>
{
  assert.throws(() => normalizeAiEndpoint('https://user:secret@example.com/v1', 'responses'), /credentials/);
});

test('拒绝 URL query 中的 API Key', () =>
{
  assert.throws(() => normalizeAiEndpoint('https://example.com/v1?api_key=secret', 'responses'), /API key or token/);
});

test('Host Permission 只保留 origin', () =>
{
  assert.equal(getHostPermissionPattern('https://example.com:8443/openai/v1'), 'https://example.com:8443/*');
});

test('解析 Responses 顶层 output_text', () =>
{
  assert.equal(extractAiResponseText('responses', { output_text: 'Short title' }), 'Short title');
});

test('解析 Responses output content', () =>
{
  const payload = {
    output: [{ content: [{ type: 'output_text', text: '标题' }] }],
  };
  assert.equal(extractAiResponseText('responses', payload), '标题');
});

test('Responses 不误取 reasoning 文本', () =>
{
  assert.throws(
    () => extractAiResponseText('responses', { output: [{ content: [{ type: 'reasoning', text: 'secret' }] }] }),
    /did not contain text/
  );
});

test('解析 Chat Completions 字符串 content', () =>
{
  assert.equal(
    extractAiResponseText('chat-completions', { choices: [{ message: { content: 'Short title' } }] }),
    'Short title'
  );
});

test('解析 Chat Completions 文本 parts', () =>
{
  const payload = { choices: [{ message: { content: [{ type: 'text', text: '标题' }] } }] };
  assert.equal(extractAiResponseText('chat-completions', payload), '标题');
});

test('标题清理成对引号、空白和句末标点', () =>
{
  assert.equal(sanitizeGeneratedTitle('  “Arc   AI 命名。”  '), 'Arc AI 命名');
});

test('拒绝多行模型输出', () =>
{
  assert.throws(() => sanitizeGeneratedTitle('Title\nExplanation'), /exactly one line/);
});

test('拒绝超长模型输出', () =>
{
  assert.throws(() => sanitizeGeneratedTitle('a'.repeat(101)), /longer than 100/);
});

test('内容优先级为页面 Markdown、llms 匹配内容、清理正文', () =>
{
  assert.equal(selectPageContent({ pageMarkdown: 'page', matchedLlmsMarkdown: 'llms', cleanedPage: 'dom' }).source, 'page-markdown');
  assert.equal(selectPageContent({ matchedLlmsMarkdown: 'llms', cleanedPage: 'dom' }).source, 'llms-txt');
  assert.equal(selectPageContent({ cleanedPage: 'dom' }).source, 'cleaned-page');
  assert.equal(selectPageContent({ llmsSummary: 'site' }).source, 'metadata-only');
});

test('llms.txt 候选从具体目录回退到站点根', () =>
{
  assert.deepEqual(
    buildLlmsTxtCandidates('https://example.com/docs/guides/page.html?x=1'),
    [
      'https://example.com/docs/guides/llms.txt',
      'https://example.com/docs/llms.txt',
      'https://example.com/llms.txt',
    ]
  );
});

test('网页 URL 中的 token query 不影响 llms.txt 路径发现', () =>
{
  assert.deepEqual(
    buildLlmsTxtCandidates('https://example.com/docs/page?access_token=page-state'),
    [
      'https://example.com/docs/page/llms.txt',
      'https://example.com/docs/llms.txt',
      'https://example.com/llms.txt',
    ]
  );
});
