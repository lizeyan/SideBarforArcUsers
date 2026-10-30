import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('顶部工具栏提供 Arc 风格的 Copy URL 按钮并连接复制操作', async () =>
{
  const toolbar = await readFile('src/components/Toolbar.tsx', 'utf8');

  assert.match(toolbar, /copyActiveTabUrl/);
  assert.match(toolbar, /data-testid="copy-active-tab-url"/);
  assert.match(toolbar, /aria-label="Copy URL"/);
  assert.match(toolbar, /onClick=\{handleCopyActiveUrl\}/);
});
