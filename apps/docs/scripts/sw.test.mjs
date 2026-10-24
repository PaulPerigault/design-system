import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import vm from 'node:vm';
import { buildSw, listFiles, versionOf, writeSw } from './sw.mjs';

/** Même schéma que `pwa-icons.test.mjs` : `node --test`, ou primitives Vitest. */
async function runner() {
  if (!process.env.VITEST) return import('node:test');
  const vitest = await import('vitest');
  return { it: vitest.it, before: vitest.beforeAll, after: vitest.afterAll };
}

const { it, before, after } = await runner();

let dir = '';
before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'sw-'));
  await mkdir(join(dir, '_astro'));
  await writeFile(join(dir, 'index.html'), '<html></html>');
  await writeFile(join(dir, '_astro', 'a.1234.css'), 'a{}');
});
after(() => rm(dir, { recursive: true, force: true }));

it('liste les fichiers triés, sans sw.js', async () => {
  await writeFile(join(dir, 'sw.js'), '//');
  assert.deepEqual(await listFiles(dir), ['_astro/a.1234.css', 'index.html']);
});

it('versionOf est stable et dépend de la liste', () => {
  assert.equal(versionOf(['a']), versionOf(['a']));
  assert.notEqual(versionOf(['a']), versionOf(['a', 'b']));
  assert.match(versionOf(['a']), /^[0-9a-f]{12}$/);
});

it('buildSw retire les export', () => {
  const script = buildSw('v1', 'export const a = 1;\nexport function b() {}\n');
  assert.doesNotMatch(script, /^export /m);
  assert.match(script, /const a = 1;/);
});

it('écrit un sw.js valide, versionné, sans URL absolue', async () => {
  const { version, path } = await writeSw(dir);
  const script = await readFile(path, 'utf8');
  assert.doesNotThrow(() => new vm.Script(script));
  assert.ok(script.includes(`const VERSION = '${version}';`));
  assert.doesNotMatch(script, /https?:\/\//);
  assert.doesNotMatch(script, /^\s*(import|export)\s/m);
  assert.match(script, /SKIP_WAITING/);
  assert.doesNotMatch(script, /^\s*self\.skipWaiting\(\);/m);
});
