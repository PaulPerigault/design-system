import * as fs from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CEILING,
  DEFAULT_MAX,
  RAISE_AFTER_MS,
  acquireLock,
  acquireSlot,
  currentMax,
  isHeavy,
  lowerMax,
  tryTake,
} from './locks.mjs';
import { installDependencies, lockHash } from './seed.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'ds-locks-'));
const io = (over = {}) => ({
  fs,
  isAlive: () => true,
  sleep: async () => {},
  now: () => 0,
  pid: 4242,
  ...over,
});

describe('sémaphore', () => {
  it('donne au plus DEFAULT_MAX places, puis attend', async () => {
    const dir = tmp();
    const releases = [];
    for (let i = 0; i < DEFAULT_MAX; i += 1) releases.push(await acquireSlot(io(), dir));
    let waited = 0;
    const pending = acquireSlot(
      io({
        sleep: async () => {
          waited += 1;
          if (waited === 2) releases[0]();
        },
      }),
      dir,
    );
    await pending;
    expect(waited).toBe(2);
  });

  it('libère une place orpheline (processus mort)', () => {
    const dir = tmp();
    fs.writeFileSync(`${dir}/slot-1`, '999999');
    expect(tryTake(io({ isAlive: () => false }), `${dir}/slot-1`)).toBe(true);
    expect(tryTake(io(), `${dir}/slot-1`)).toBe(false);
  });

  it('relève à 6 après 30 min sans erreur, redescend à la première erreur', () => {
    const dir = tmp();
    expect(currentMax(io({ now: () => 0 }), dir)).toBe(DEFAULT_MAX);
    expect(currentMax(io({ now: () => RAISE_AFTER_MS }), dir)).toBe(CEILING);
    expect(currentMax(io({ now: () => 3 * RAISE_AFTER_MS }), dir)).toBe(CEILING);
    expect(lowerMax(io(), dir)).toBe(CEILING - 1);
  });
});

describe('verrou des tâches lourdes', () => {
  it('reconnaît les commandes lourdes', () => {
    expect(isHeavy('npx playwright test -c apps/docs/playwright.config.ts')).toBe(true);
    expect(isHeavy('npm -w @paulperigault/docs run build')).toBe(true);
    expect(isHeavy('npx vitest run packages/tokens')).toBe(false);
    expect(isHeavy('npx tsc --noEmit -p packages/astro')).toBe(false);
  });

  it('est exclusif jusqu’à sa libération', async () => {
    const file = `${tmp()}/locks/heavy`;
    const release = await acquireLock(io(), file);
    expect(tryTake(io(), file)).toBe(false);
    release();
    expect(tryTake(io(), file)).toBe(true);
  });
});

describe('amorce node_modules', () => {
  const world = (ready) => {
    const calls = [];
    const fakeFs = { readFileSync: () => '{"lockfileVersion":3}', existsSync: () => ready };
    const shell = async (cmd) => (calls.push(cmd), { code: 0, stdout: '', stderr: '' });
    return { calls, deps: { shell, fs: fakeFs, seedsDir: '/s', cwd: '/w', env: {}, timeoutMs: 1 } };
  };

  it('clone l’amorce existante par cp -cR, sans npm ci', async () => {
    const { calls, deps } = world(true);
    expect((await installDependencies(deps)).seeded).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('cp -cR');
    expect(calls[0]).toContain(`/s/${lockHash('{"lockfileVersion":3}')}`);
  });

  it('sans amorce : npm ci puis création de l’amorce', async () => {
    const { calls, deps } = world(false);
    expect((await installDependencies(deps)).seeded).toBe(false);
    expect(calls[0]).toMatch(/^npm ci /);
    expect(calls[1]).toMatch(/cp -cR .* && mv .* && touch .*\/ready/);
  });
});
