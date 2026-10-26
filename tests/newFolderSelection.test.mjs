import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveNewFolderParentId } from '../src/utils/newFolderSelection.ts';

test('同一父文件夹的选中项在原父文件夹中组成新文件夹', () =>
{
  const nodes = [
    { id: 'a', parentId: 'same-parent' },
    { id: 'b', parentId: 'same-parent' },
  ];

  assert.equal(resolveNewFolderParentId(nodes, 'space-root'), 'same-parent');
});

test('跨父文件夹的选中项移动到当前 Space 根目录', () =>
{
  const nodes = [
    { id: 'a', parentId: 'parent-a' },
    { id: 'b', parentId: 'parent-b' },
  ];

  assert.equal(resolveNewFolderParentId(nodes, 'space-root'), 'space-root');
});

test('Space 文件夹配置缺失时回退到第一个选中项的父文件夹', () =>
{
  const nodes = [
    { id: 'a', parentId: 'parent-a' },
    { id: 'b', parentId: 'parent-b' },
  ];

  assert.equal(resolveNewFolderParentId(nodes, null), 'parent-a');
});
