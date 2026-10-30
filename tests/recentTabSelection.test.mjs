import assert from 'node:assert/strict';
import test from 'node:test';

import { RecentTabSelection } from '../src/utils/recentTabSelection.ts';

test('打开切换窗口时默认选中上一个使用的标签', () =>
{
  const selection = RecentTabSelection.open([303, 202, 101]);

  assert.ok(selection);
  assert.deepEqual(selection.tabIds, [303, 202, 101]);
  assert.equal(selection.selectedTabId, 202);
});

test('没有其他标签时不打开切换窗口', () =>
{
  assert.equal(RecentTabSelection.open([]), null);
  assert.equal(RecentTabSelection.open([303]), null);
});

test('正向和反向移动选择时在候选列表内循环', () =>
{
  const initial = RecentTabSelection.open([404, 303, 202, 101]);
  assert.ok(initial);

  const second = initial.move(1);
  const third = second.move(1);
  const wrappedForward = third.move(1);
  const wrappedBackward = wrappedForward.move(-1);

  assert.equal(second.selectedTabId, 202);
  assert.equal(third.selectedTabId, 101);
  assert.equal(wrappedForward.selectedTabId, 404);
  assert.equal(wrappedBackward.selectedTabId, 101);
});

test('候选列表变化时保留选中标签或回退到相邻有效项', () =>
{
  const initial = RecentTabSelection.open([404, 303, 202, 101]);
  assert.ok(initial);

  const selected202 = initial.move(1);
  const preserved = selected202.update([404, 303, 202]);
  const fallback = selected202.update([404, 303, 101]);

  assert.ok(preserved);
  assert.equal(preserved.selectedTabId, 202);
  assert.ok(fallback);
  assert.equal(fallback.selectedTabId, 101);
  assert.equal(selected202.update([404]), null);
});

test('鼠标经过候选项时按 Tab ID 更新选择', () =>
{
  const initial = RecentTabSelection.open([404, 303, 202, 101]);
  assert.ok(initial);

  const selected = initial.select(101);

  assert.equal(selected.selectedTabId, 101);
  assert.equal(selected.select(999), selected);
});
