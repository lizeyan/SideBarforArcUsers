import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveTrackedTabGroupMove } from '../src/utils/trackedTabGroupMove.ts';

test('Favorite 跨 Space 原生组移动时保持固定并更新归属', () =>
{
  assert.equal(resolveTrackedTabGroupMove({
    itemKey: 'pinned-favorite',
    registeredSpaceId: 'space-a',
    liveSpaceId: 'space-b',
  }), 'update-space');
});

test('书签固定 Tab 跨出所属 Space 时解除关联', () =>
{
  assert.equal(resolveTrackedTabGroupMove({
    itemKey: 'bookmark-42',
    registeredSpaceId: 'space-a',
    liveSpaceId: 'space-b',
  }), 'deassociate');
});

test('仍在原 Space 时不产生同步动作', () =>
{
  assert.equal(resolveTrackedTabGroupMove({
    itemKey: 'pinned-favorite',
    registeredSpaceId: 'space-a',
    liveSpaceId: 'space-a',
  }), 'none');
});

test('Favorite 被原生移出组后恢复到登记的 Space', () =>
{
  assert.equal(resolveTrackedTabGroupMove({
    itemKey: 'pinned-favorite',
    registeredSpaceId: 'space-a',
    liveSpaceId: undefined,
  }), 'restore-space');
});

test('书签固定 Tab 被原生移出组后转为普通 Tab', () =>
{
  assert.equal(resolveTrackedTabGroupMove({
    itemKey: 'bookmark-42',
    registeredSpaceId: 'space-a',
    liveSpaceId: undefined,
  }), 'deassociate');
});
