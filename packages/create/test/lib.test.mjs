import { describe, expect, it } from 'vitest';
import { LOCK_FILE, readLock, serializeLock, withItem } from '../src/lib/lock.mjs';
import { applyPlan } from '../src/lib/plan.mjs';
import { fakeIo } from './fake-io.mjs';

describe('lock', () => {
  const entry = { package: '@paulperigault/astro', version: '0.0.0', files: [] };

  it('verrou vide si absent, erreur si version inconnue', () => {
    const { io, files } = fakeIo({});
    expect(readLock(io)).toEqual({ lockfileVersion: 1, items: {} });
    files[`/projet/${LOCK_FILE}`] = '{"lockfileVersion":2,"items":{}}';
    expect(() => readLock(io)).toThrow('lockfileVersion');
  });

  it('refuse des items qui ne sont pas un objet simple', () => {
    const { io, files } = fakeIo({});
    for (const items of ['[]', '"x"']) {
      files[`/projet/${LOCK_FILE}`] = `{"lockfileVersion":1,"items":${items}}`;
      expect(() => readLock(io)).toThrow('items');
    }
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
    const { io, files, out, err } = fakeIo({ '/projet/a.txt': 'old' });
    expect(applyPlan(io, plan)).toBe(1);
    expect(files['/projet/b.txt']).toBeUndefined();
    expect(files['/projet/a.txt']).toBe('old');
    expect(out).toEqual([]);
    expect(err).toHaveLength(1);
    expect(err[0]).toContain('a.txt');
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

  it('dryRun sans force signale le conflit', () => {
    const { io, files, out, err } = fakeIo({ '/projet/a.txt': 'old' });
    expect(applyPlan(io, plan, { dryRun: true })).toBe(1);
    expect(err).toHaveLength(1);
    expect(err[0]).toContain('a.txt');
    expect(out).toEqual([]);
    expect(files).toEqual({ '/projet/a.txt': 'old' });
  });
});
