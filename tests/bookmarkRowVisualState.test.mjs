import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveBookmarkRowVisualState } from '../src/utils/bookmarkRowVisualState.ts';

test('当前活跃固定 Tab 的单项选择仍使用 active 样式', () =>
{
  assert.equal(resolveBookmarkRowVisualState({
    isActive: true,
    isSelected: true,
    selectionCount: 1,
  }), 'active');
});

test('真正多选时使用 selected 样式覆盖 active', () =>
{
  assert.equal(resolveBookmarkRowVisualState({
    isActive: true,
    isSelected: true,
    selectionCount: 3,
  }), 'selected');
});

test('未选中的非活跃固定 Tab 使用 default 样式', () =>
{
  assert.equal(resolveBookmarkRowVisualState({
    isActive: false,
    isSelected: false,
    selectionCount: 0,
  }), 'default');
});
