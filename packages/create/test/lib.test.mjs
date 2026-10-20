import { describe, expect, it } from 'vitest';
import { sha256 } from '../src/lib/hash.mjs';
import { resolveIn } from '../src/lib/io.mjs';
import { LOCK_FILE, readLock, serializeLock, withItem } from '../src/lib/lock.mjs';
import { applyPlan } from '../src/lib/plan.mjs';
import * as reg from '../src/lib/registry.mjs';
import { fakeIo, fakePackage } from './fake-io.mjs';

const stack = { name: 'stack', title: 'Stack', files: [{ path: 'packages/astro/src/S.astro' }] };
const button = { name: 'button', title: 'Button', files: [{ path: 'packages/astro/src/B.astro' }] };
const ROOT = '/projet/node_modules/@paulperigault/astro';
const ITEMS = `${ROOT}/registry/items`;

describe('io et hash', () => {
  it('résout les chemins relatifs et absolus', () => {
    const { io } = fakeIo({});
    expect([resolveIn(io, 'a/b'), resolveIn(io, '/x/y')]).toEqual(['/projet/a/b', '/x/y']);
  });

  it('sha256 hexadécimal, fins de ligne conservées', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256('a\r\n')).not.toBe(sha256('a\n'));
  });
});

describe('registry', () => {
  it('trie les éléments et lit la version', () => {
    const { io } = fakeIo(fakePackage({}, [stack, button]));
    const root = reg.packageRoot(io);
    expect(root).toBe(ROOT);
    expect(reg.packageRoot(io, 'node_modules/@paulperigault/astro')).toBe(ROOT);
    expect(reg.packageRoot(io, ROOT)).toBe(ROOT);
    expect(reg.loadItems(io, root).map((i) => i.name)).toEqual(['button', 'stack']);
    expect(reg.packageVersion(io, root)).toBe('1.2.3');
  });

  it('explique comment installer un paquet absent', () => {
    expect(() => reg.packageRoot(fakeIo({}).io)).toThrow('npm i @paulperigault/astro');
  });

  it('signale un fragment invalide avec son chemin', () => {
    const files = fakePackage({}, [stack]);
    const { io } = fakeIo(files);
    files[`${ITEMS}/bad.json`] = '{nope';
    expect(() => reg.loadItems(io, ROOT)).toThrow('bad.json');
    files[`${ITEMS}/bad.json`] = '{"name":"x"}';
    expect(() => reg.loadItems(io, ROOT)).toThrow('bad.json');
  });

  it('trouve par nom ou titre sans tenir compte de la casse', () => {
    const items = [button, stack];
    expect(reg.findItem(items, 'Button')).toBe(button);
    expect(reg.findItem(items, 'STACK')).toBe(stack);
    expect(() => reg.findItem(items, 'card')).toThrow('button, stack');
  });

  it('retire le préfixe du dépôt et refuse les chemins hors paquet', () => {
    expect(reg.itemFiles(stack)).toEqual(['src/S.astro']);
    for (const path of ['../x.astro', '/etc/passwd', 'packages/astro/../../x']) {
      expect(() => reg.itemFiles({ name: 'evil', files: [{ path }] })).toThrow('hors du paquet');
    }
  });
});

describe('lock', () => {
  const entry = { package: '@paulperigault/astro', version: '0.0.0', files: [] };

  it('verrou vide si absent, erreur si version inconnue', () => {
    const { io, files } = fakeIo({});
    expect(readLock(io)).toEqual({ lockfileVersion: 1, items: {} });
    files[`/projet/${LOCK_FILE}`] = '{"lockfileVersion":2,"items":{}}';
    expect(() => readLock(io)).toThrow('lockfileVersion');
  });

  it('withItem ne mute pas, serializeLock trie les clés', () => {
    const base = { lockfileVersion: 1, items: {} };
    const next = withItem(withItem(base, 'stack', entry), 'button', entry);
    expect(base.items).toEqual({});
    const text = serializeLock(next);
    expect(text.endsWith('}\n')).toBe(true);
    expect(text.indexOf('"button"')).toBeLessThan(text.indexOf('"stack"'));
    expect(text).toContain('\n  "items"');
    expect(readLock(fakeIo({ [`/projet/${LOCK_FILE}`]: text }).io)).toEqual(next);
  });
});

describe('plan', () => {
  const plan = [
    { path: 'a.txt', content: 'A' },
    { path: 'b.txt', content: 'B' },
  ];

  it('écrit et affiche chaque fichier', () => {
    const { io, files, out } = fakeIo({});
    expect(applyPlan(io, plan)).toBe(0);
    expect(files['/projet/a.txt']).toBe('A');
    expect(out).toEqual(['écrit a.txt', 'écrit b.txt']);
  });

  it('liste tous les conflits et n’écrit rien', () => {
    const { io, files, err } = fakeIo({ '/projet/a.txt': 'old', '/projet/b.txt': 'old' });
    expect([applyPlan(io, plan), err.length, files['/projet/a.txt']]).toEqual([1, 2, 'old']);
  });

  it('écrase avec overwrite ou force', () => {
    const one = fakeIo({ '/projet/a.txt': 'old' });
    expect(applyPlan(one.io, [{ path: 'a.txt', content: 'N', overwrite: true }])).toBe(0);
    expect(one.files['/projet/a.txt']).toBe('N');
    const two = fakeIo({ '/projet/a.txt': 'old' });
    expect(applyPlan(two.io, plan, { force: true })).toBe(0);
  });

  it('dryRun décrit sans écrire', () => {
    const { io, files, out } = fakeIo({ '/projet/a.txt': 'old' });
    expect(applyPlan(io, plan, { dryRun: true, force: true })).toBe(0);
    expect(out).toEqual(['écraserait a.txt', 'créerait b.txt']);
    expect(files).toEqual({ '/projet/a.txt': 'old' });
  });
});
