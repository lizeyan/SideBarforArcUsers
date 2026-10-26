import assert from 'node:assert/strict';
import test from 'node:test';

import { filterUnmanagedTabs } from '../src/utils/tabVisibility.ts';

test('Tabs 只显示既不属于书签也不属于 Favorites 的真实 Chrome Tab', () =>
{
  const tabs = [
    { id: 1, index: 0, title: 'Bookmark tab', groupId: 8, pinned: false },
    { id: 2, index: 1, title: 'Unmanaged grouped tab', groupId: 8, pinned: true },
    { id: 3, index: 2, title: 'Favorite tab', groupId: -1, pinned: false },
  ];
  const managedTabIds = new Set([1, 3]);

  const visible = filterUnmanagedTabs(tabs, managedTabIds);

  assert.deepEqual(visible, [tabs[1]]);
  assert.equal(visible[0].groupId, 8);
  assert.equal(visible[0].pinned, true);
});
