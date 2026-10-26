import assert from 'node:assert/strict';
import test from 'node:test';

import { TabAssociationSessionStore } from '../src/stores/tabAssociationSessionStore.ts';

class MemoryStorage
{
  data = {};

  async get(key)
  {
    return { [key]: structuredClone(this.data[key]) };
  }

  async set(values)
  {
    await Promise.resolve();
    Object.assign(this.data, structuredClone(values));
  }
}

test('并发建立多个固定 Tab 的 session 关联不会互相覆盖', async () =>
{
  const storage = new MemoryStorage();
  const store = new TabAssociationSessionStore(storage);

  await Promise.all([
    store.save(42, 1, 'bookmark-a'),
    store.save(42, 2, 'bookmark-b'),
    store.save(42, 3, 'pinned-c'),
  ]);

  assert.deepEqual(await store.read(42), {
    1: 'bookmark-a',
    2: 'bookmark-b',
    3: 'pinned-c',
  });
});
