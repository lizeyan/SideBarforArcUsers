import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getVisibleBookmarkChildren,
  resolveBookmarkRowClickIntent,
} from '../src/utils/bookmarkTreeVisibility.ts';

const nestedTree = {
  id: 'folder-root',
  title: 'FaultScout',
  children: [
    {
      id: 'folder-nested',
      title: 'Nested',
      children: [
        { id: 'bookmark-active', title: 'Active', url: 'https://active.example.com' },
        { id: 'bookmark-idle', title: 'Idle', url: 'https://idle.example.com' },
      ],
    },
  ],
};

test('折叠文件夹时只透出子树里的活跃固定 Tab', () =>
{
  const visibleChildren = getVisibleBookmarkChildren(
    nestedTree,
    false,
    (bookmarkId) => bookmarkId === 'bookmark-active',
  );

  assert.deepEqual(visibleChildren, [
    {
      node: nestedTree.children[0].children[0],
      isActivePeek: true,
    },
  ]);
});

test('折叠文件夹没有活跃固定 Tab 时不展示后代', () =>
{
  assert.deepEqual(
    getVisibleBookmarkChildren(nestedTree, false, () => false),
    [],
  );
});

test('展开文件夹时保持原有直接子节点，不额外提升活跃后代', () =>
{
  assert.deepEqual(
    getVisibleBookmarkChildren(nestedTree, true, () => true),
    [{ node: nestedTree.children[0], isActivePeek: false }],
  );
});

test('普通点击文件夹行会切换折叠状态，组合键点击仍只处理选择', () =>
{
  assert.equal(resolveBookmarkRowClickIntent(true, false), 'toggle-folder');
  assert.equal(resolveBookmarkRowClickIntent(true, true), 'select-only');
  assert.equal(resolveBookmarkRowClickIntent(false, false), 'open-bookmark');
});
