import assert from 'node:assert/strict';
import test from 'node:test';

import { RecentTabCommandSession } from '../src/utils/recentTabCommandSession.ts';

test('第一次触发隐藏窗口并选择上一个标签', () =>
{
  const session = RecentTabCommandSession.start([404, 303, 202, 101], 1000);

  assert.ok(session);
  assert.deepEqual(session.tabIds, [404, 303, 202, 101]);
  assert.equal(session.selectedTabId, 303);
  assert.equal(session.overlayVisible, false);
});

test('后续触发沿冻结顺序循环并显示窗口', () =>
{
  const initial = RecentTabCommandSession.start([404, 303, 202, 101], 1000);
  assert.ok(initial);

  const second = initial.advance(1100);
  const third = second.advance(1200);
  const wrapped = third.advance(1300);

  assert.equal(second.selectedTabId, 202);
  assert.equal(second.overlayVisible, true);
  assert.equal(third.selectedTabId, 101);
  assert.equal(wrapped.selectedTabId, 404);
  assert.deepEqual(wrapped.tabIds, [404, 303, 202, 101]);
});

test('最后一次触发后按无输入时间判断会话过期', () =>
{
  const initial = RecentTabCommandSession.start([202, 101], 1000);
  assert.ok(initial);
  const session = initial.advance(1200);

  assert.equal(session.isExpired(1799, 600), false);
  assert.equal(session.isExpired(1800, 600), true);
});

test('少于两个标签时不建立命令会话', () =>
{
  assert.equal(RecentTabCommandSession.start([], 1000), null);
  assert.equal(RecentTabCommandSession.start([101], 1000), null);
});
