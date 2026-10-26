import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveActiveSpaceId,
  resolveSpaceIdAfterDeletion,
} from '../src/utils/spaceSelection.ts';

const spaces = [
  { id: 'space-a' },
  { id: 'space-b' },
  { id: 'space-c' },
];

test('旧的 All Space 状态迁移到第一个真实 Space', () =>
{
  assert.equal(resolveActiveSpaceId(spaces, 'all'), 'space-a');
});

test('仍然存在的真实 Space 保持选中', () =>
{
  assert.equal(resolveActiveSpaceId(spaces, 'space-b'), 'space-b');
});

test('已删除或未知的 Space 回退到第一个真实 Space', () =>
{
  assert.equal(resolveActiveSpaceId(spaces, 'missing'), 'space-a');
});

test('没有真实 Space 时不再回退到 All Space', () =>
{
  assert.equal(resolveActiveSpaceId([], 'all'), null);
});

test('删除当前 Space 后优先切换到右侧相邻 Space', () =>
{
  assert.equal(
    resolveSpaceIdAfterDeletion(spaces, 'space-b', 'space-b'),
    'space-c',
  );
});

test('删除最后一个 Space 时切换到左侧相邻 Space', () =>
{
  assert.equal(
    resolveSpaceIdAfterDeletion(spaces, 'space-c', 'space-c'),
    'space-b',
  );
});

test('删除非当前 Space 时保持当前 Space', () =>
{
  assert.equal(
    resolveSpaceIdAfterDeletion(spaces, 'space-a', 'space-c'),
    'space-c',
  );
});
