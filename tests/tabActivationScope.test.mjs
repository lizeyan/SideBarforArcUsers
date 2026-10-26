import assert from 'node:assert/strict';
import test from 'node:test';

import { isActivationForWindow } from '../src/utils/tabActivationScope.ts';

test('只接受当前 Side Panel 所属窗口的原生标签激活事件', () =>
{
  assert.equal(isActivationForWindow(9, { windowId: 9 }), true);
  assert.equal(isActivationForWindow(9, { windowId: 10 }), false);
  assert.equal(isActivationForWindow(null, { windowId: 9 }), false);
});
