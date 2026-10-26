import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveVersionDialogState } from '../src/utils/versionDialogState.ts';

test('版本存储尚未加载时不启动任何欢迎或升级对话框', () =>
{
  assert.deepEqual(resolveVersionDialogState({
    isLoaded: false,
    lastSeenVersion: '',
    currentVersion: '1.0.344',
  }), {
    isNewInstall: false,
    hasVersionChanged: false,
  });
});

test('加载完成后空版本表示全新安装', () =>
{
  assert.deepEqual(resolveVersionDialogState({
    isLoaded: true,
    lastSeenVersion: '',
    currentVersion: '1.0.344',
  }), {
    isNewInstall: true,
    hasVersionChanged: false,
  });
});

test('加载完成后的旧版本表示需要显示升级内容', () =>
{
  assert.deepEqual(resolveVersionDialogState({
    isLoaded: true,
    lastSeenVersion: '1.0.300',
    currentVersion: '1.0.344',
  }), {
    isNewInstall: false,
    hasVersionChanged: true,
  });
});
