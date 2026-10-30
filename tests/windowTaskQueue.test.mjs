import assert from 'node:assert/strict';
import test from 'node:test';

import { WindowTaskQueue } from '../src/utils/windowTaskQueue.ts';

test('同一窗口的快速切换按触发顺序串行执行', async () =>
{
  const queue = new WindowTaskQueue();
  let activeTabId = 202;
  const activatedTabIds = [];

  const switchTask = () => queue.run(9, async () =>
  {
    const targetTabId = activeTabId === 202 ? 101 : 202;
    await new Promise(resolve => setTimeout(resolve, 5));
    activeTabId = targetTabId;
    activatedTabIds.push(targetTabId);
  });

  await Promise.all([switchTask(), switchTask()]);

  assert.deepEqual(activatedTabIds, [101, 202]);
});
