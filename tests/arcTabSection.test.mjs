import assert from 'node:assert/strict';
import test from 'node:test';

import { getArcTabSectionItems } from '../src/utils/arcTabSection.ts';

test('Arc 标签区先显示 New Tab，再显示普通标签页', () =>
{
  const tabs = [{ id: 1 }, { id: 2 }];

  assert.deepEqual(getArcTabSectionItems(tabs), [
    { type: 'new-tab' },
    { type: 'tab', tab: tabs[0] },
    { type: 'tab', tab: tabs[1] },
  ]);
});
