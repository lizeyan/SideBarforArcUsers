import assert from 'node:assert/strict';
import test from 'node:test';

import { SharedTabStore } from '../src/stores/sharedTabStore.ts';

class FakeTabSource
{
  readCount = 0;
  subscribeCount = 0;
  unsubscribeCount = 0;
  changeListener = null;

  readTabs(onResult)
  {
    this.readCount += 1;
    onResult([{ id: 1, title: 'One' }], null);
  }

  subscribe(onChange)
  {
    this.subscribeCount += 1;
    this.changeListener = onChange;
    return () =>
    {
      this.unsubscribeCount += 1;
      this.changeListener = null;
    };
  }
}

test('多个 useTabs 调用共享一次查询和一组事件监听器', () =>
{
  const source = new FakeTabSource();
  const store = new SharedTabStore(() => source, () => false, 0);

  const unsubscribeFirst = store.subscribe(() => {});
  const unsubscribeSecond = store.subscribe(() => {});

  assert.equal(source.readCount, 1);
  assert.equal(source.subscribeCount, 1);

  unsubscribeFirst();
  assert.equal(source.unsubscribeCount, 0);

  unsubscribeSecond();
  assert.equal(source.unsubscribeCount, 1);
});
