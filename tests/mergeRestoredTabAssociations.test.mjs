import assert from 'node:assert/strict';
import test from 'node:test';

import { mergeRestoredTabAssociations } from '../src/utils/restoreTabAssociations.ts';

test('恢复时保留有效 session 关联，并只用 backup 补充缺失项', () =>
{
  const merged = mergeRestoredTabAssociations(
    {
      1: 'bookmark-a',
      2: 'bookmark-b',
      99: 'bookmark-closed',
    },
    {
      1: 'bookmark-old-copy',
      3: 'pinned-c',
      4: 'bookmark-b',
    },
    new Set([1, 2, 3, 4])
  );

  assert.deepEqual(merged, {
    1: 'bookmark-a',
    2: 'bookmark-b',
    3: 'pinned-c',
  });
});
