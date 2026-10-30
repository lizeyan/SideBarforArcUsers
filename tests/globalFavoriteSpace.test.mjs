import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isGlobalFavoriteTab,
  resolveTabSpaceAssignment,
} from '../src/utils/globalFavoriteTabs.ts';

test('Global Favorite 关联的 Tab 不属于任何 Space', () =>
{
  assert.equal(isGlobalFavoriteTab({
    itemKey: 'pinned-google',
    tabUrl: 'https://example.com/redirected',
    favoriteUrls: ['https://google.com'],
  }), true);
});

test('尚未恢复关联时，匹配 Favorite URL 的 Tab 仍保持全局身份', () =>
{
  assert.equal(isGlobalFavoriteTab({
    tabUrl: 'https://google.com/#search',
    favoriteUrls: ['https://google.com/'],
  }), true);

  assert.equal(isGlobalFavoriteTab({
    tabUrl: 'https://example.com',
    favoriteUrls: ['https://google.com/'],
  }), false);
});

test('Global Favorite 删除历史 Space 归属，且不登记当前 Space', () =>
{
  assert.deepEqual(resolveTabSpaceAssignment({
    isGlobalFavorite: true,
    assignedSpaceId: 'space-a',
    fallbackSpaceId: 'space-b',
  }), {
    spaceId: undefined,
    shouldUnregister: true,
  });

  assert.deepEqual(resolveTabSpaceAssignment({
    isGlobalFavorite: true,
    fallbackSpaceId: 'space-b',
  }), {
    spaceId: undefined,
    shouldUnregister: false,
  });
});

test('普通 Tab 保留已有归属，未归属时才使用当前 Space', () =>
{
  assert.deepEqual(resolveTabSpaceAssignment({
    isGlobalFavorite: false,
    assignedSpaceId: 'space-a',
    fallbackSpaceId: 'space-b',
  }), {
    spaceId: 'space-a',
    shouldUnregister: false,
  });

  assert.deepEqual(resolveTabSpaceAssignment({
    isGlobalFavorite: false,
    fallbackSpaceId: 'space-b',
  }), {
    spaceId: 'space-b',
    shouldUnregister: false,
  });
});
