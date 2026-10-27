import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveArcFolderIconState } from '../src/utils/folderIconState.ts';

test('文件夹图标按 Arc 的折叠、展开和活跃透出状态切换', () =>
{
  assert.equal(resolveArcFolderIconState(false, false), 'collapsed');
  assert.equal(resolveArcFolderIconState(true, false), 'expanded');
  assert.equal(resolveArcFolderIconState(false, true), 'active-peek');

  // 文件夹展开时显示开口图标；活跃子项仍正常显示，但不覆盖展开状态。
  assert.equal(resolveArcFolderIconState(true, true), 'expanded');
});
