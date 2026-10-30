import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const manifest = JSON.parse(
  await readFile(new URL('../public/manifest.json', import.meta.url), 'utf8')
);

test('最近标签命令已注册但不伪装占用 Chrome 保留快捷键', () =>
{
  const command = manifest.commands['switch-recent-tab'];

  assert.ok(command);
  assert.equal(command.description, 'Switch to Most Recent Tab');
  assert.equal(command.suggested_key, undefined);

  const declaredShortcuts = Object.values(manifest.commands)
    .flatMap(candidate => Object.values(candidate.suggested_key ?? {}));
  assert.equal(declaredShortcuts.includes('Ctrl+Tab'), false);
});
