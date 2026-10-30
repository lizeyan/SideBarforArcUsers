import assert from 'node:assert/strict';
import test from 'node:test';

import { RecentTabOrder } from '../src/utils/recentTabOrder.ts';

test('最近两个标签可以持续来回切换', () =>
{
  const order = new RecentTabOrder();

  order.record(101);
  order.record(202);
  assert.equal(order.getMostRecentOther(202), 101);

  order.record(101);
  assert.equal(order.getMostRecentOther(101), 202);
});

test('重复激活标签只调整最近使用顺序而不产生重复项', () =>
{
  const order = new RecentTabOrder();

  order.record(101);
  order.record(202);
  order.record(303);
  order.record(202);

  assert.deepEqual(order.toArray(), [202, 303, 101]);
});

test('关闭标签后从最近使用顺序中移除', () =>
{
  const order = new RecentTabOrder([303, 202, 101]);

  order.remove(202);

  assert.deepEqual(order.toArray(), [303, 101]);
  assert.equal(order.getMostRecentOther(303), 101);
});

test('恢复和新增记录都会去重并限制最近标签数量', () =>
{
  const order = new RecentTabOrder([303, 202, 303, 101], 3);

  assert.deepEqual(order.toArray(), [303, 202, 101]);

  order.record(404);
  assert.deepEqual(order.toArray(), [404, 303, 202]);
});

test('读取实时标签时可以一次清理所有失效记录', () =>
{
  const order = new RecentTabOrder([404, 303, 202, 101]);

  const changed = order.retain(new Set([404, 202]));

  assert.equal(changed, true);
  assert.deepEqual(order.toArray(), [404, 202]);
  assert.equal(order.retain(new Set([404, 202])), false);
});

test('首次读取窗口时把尚无历史的实时标签追加到末尾', () =>
{
  const order = new RecentTabOrder([202]);

  const changed = order.appendMissing([101, 202, 303]);

  assert.equal(changed, true);
  assert.deepEqual(order.toArray(), [202, 101, 303]);
  assert.equal(order.appendMissing([101, 202, 303]), false);
});
