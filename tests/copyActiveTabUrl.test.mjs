import assert from 'node:assert/strict';
import test from 'node:test';

import { copyActiveTabUrl } from '../src/utils/copyActiveTabUrl.ts';

test('复制当前 Side Panel 窗口的活跃 Tab URL', async () =>
{
  const queriedWindowIds = [];
  const copiedTexts = [];

  const copiedUrl = await copyActiveTabUrl(42, {
    getActiveTab: async (windowId) =>
    {
      queriedWindowIds.push(windowId);
      return { url: 'https://example.com/path?q=1#section' };
    },
    writeText: async (text) =>
    {
      copiedTexts.push(text);
    },
  });

  assert.equal(copiedUrl, 'https://example.com/path?q=1#section');
  assert.deepEqual(queriedWindowIds, [42]);
  assert.deepEqual(copiedTexts, ['https://example.com/path?q=1#section']);
});

test('活跃 Tab 没有 URL 时不写入剪贴板', async () =>
{
  let writeCount = 0;

  await assert.rejects(
    copyActiveTabUrl(42, {
      getActiveTab: async () => undefined,
      writeText: async () =>
      {
        writeCount += 1;
      },
    }),
    /Active tab has no URL/
  );

  assert.equal(writeCount, 0);
});
