import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Space 生命周期不得再创建或维护 Chrome 原生标签组', async () =>
{
  const background = await readFile('src/background.ts', 'utf8');
  const operations = await readFile('src/utils/tabOperations.ts', 'utf8');

  assert.doesNotMatch(background, /SpaceTabGroupManager/);
  assert.doesNotMatch(background, /queueTabForGrouping/);
  assert.doesNotMatch(background, /chrome\.tabs\.group/);
  assert.doesNotMatch(operations, /getOrCreateSpaceGroup/);
  assert.match(background, /chrome\.tabs\.onCreated[\s\S]*tabSpaceRegistry\.register/);
});
