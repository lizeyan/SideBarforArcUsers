import assert from 'node:assert/strict';
import test from 'node:test';

import { SharedBookmarkStore } from '../src/stores/sharedBookmarkStore.ts';

class FakeBookmarkSource
{
  readCount = 0;
  subscribeCount = 0;
  unsubscribeCount = 0;
  changeListener = null;

  readTree(onResult)
  {
    this.readCount += 1;
    onResult([{ id: '0', title: '', children: [] }]);
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

  emitChange()
  {
    this.changeListener?.();
  }
}

test('多个订阅者共享一次初始读取和一组 Chrome 监听器', () =>
{
  const source = new FakeBookmarkSource();
  const store = new SharedBookmarkStore(() => source, () => false, 0);

  const unsubscribeFirst = store.subscribe(() => {});
  const unsubscribeSecond = store.subscribe(() => {});

  assert.equal(source.readCount, 1);
  assert.equal(source.subscribeCount, 1);

  unsubscribeFirst();
  assert.equal(source.unsubscribeCount, 0);

  unsubscribeSecond();
  assert.equal(source.unsubscribeCount, 1);
});

test('书签事件合并为一次共享刷新', async () =>
{
  const source = new FakeBookmarkSource();
  const store = new SharedBookmarkStore(() => source, () => false, 0);
  const unsubscribe = store.subscribe(() => {});

  source.emitChange();
  source.emitChange();
  await new Promise(resolve => setTimeout(resolve, 5));

  assert.equal(source.readCount, 2);
  unsubscribe();
});
