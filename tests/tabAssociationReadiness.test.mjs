import assert from 'node:assert/strict';
import test from 'node:test';

import { TabAssociationReadiness } from '../src/utils/tabAssociationReadiness.ts';

function deferred()
{
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

test('关联状态只能在 manager 加载和备份恢复都完成后就绪', async () =>
{
  const managerLoad = deferred();
  const restore = deferred();
  let restoreStarted = false;
  let ready = false;

  const readiness = new TabAssociationReadiness(
    () => managerLoad.promise,
    () =>
    {
      restoreStarted = true;
      return restore.promise;
    }
  );

  readiness.wait().then(() => { ready = true; });
  await Promise.resolve();
  assert.equal(restoreStarted, false);
  assert.equal(ready, false);

  managerLoad.resolve();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(restoreStarted, true);
  assert.equal(ready, false);

  restore.resolve();
  await readiness.wait();
  assert.equal(ready, true);
});
