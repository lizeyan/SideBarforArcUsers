import assert from 'node:assert/strict';
import test from 'node:test';

import { filterTabsForSpace, filterUnmanagedTabs } from '../src/utils/tabVisibility.ts';

test('Tabs 只显示既不属于书签也不属于 Favorites 的真实 Chrome Tab', () =>
{
  const tabs = [
    { id: 1, index: 0, title: 'Managed bookmark tab', url: 'https://managed.example', groupId: 8, pinned: false },
    { id: 2, index: 1, title: 'Unmanaged grouped tab', groupId: 8, pinned: true },
    { id: 3, index: 2, title: 'Managed favorite tab', url: 'https://favorite.example', groupId: -1, pinned: false },
    { id: 4, index: 3, title: 'Ordinary tab with bookmark URL', url: 'https://docs.example/page/', groupId: 8, pinned: false },
    {
      id: 5,
      index: 4,
      title: 'Parked favorite tab',
      url: 'chrome-extension://suspender/park.html?tabId=50&url=https%3A%2F%2Ffavorite-two.example%2F',
      groupId: 8,
      pinned: false,
    },
  ];
  const managedTabIds = new Set([1, 3]);
  const persistentUrls = new Set([
    'https://docs.example/page',
    'https://favorite-two.example',
  ]);

  const visible = filterUnmanagedTabs(tabs, managedTabIds, persistentUrls);

  assert.deepEqual(visible, [tabs[1]]);
  assert.equal(visible[0].groupId, 8);
  assert.equal(visible[0].pinned, true);
});

test('普通 Tabs 按扩展自己的 Space 关联过滤，不依赖 Chrome groupId', () =>
{
  const tabs = [
    { id: 1, title: 'A', groupId: 91 },
    { id: 2, title: 'B', groupId: 91 },
    { id: 3, title: 'C', groupId: -1 },
  ];
  const assignments = { 1: 'space-a', 2: 'space-b', 3: 'space-a' };

  assert.deepEqual(
    filterTabsForSpace(tabs, assignments, 'space-a').map(tab => tab.id),
    [1, 3]
  );
});
