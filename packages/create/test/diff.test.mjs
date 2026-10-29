import { describe, expect, it } from 'vitest';
import { run } from '../src/application/commands/diff.ts';
import { sha256 } from '../src/domain/hash.ts';
import { LOCK_FILE } from '../src/domain/lock.ts';
import { fakeIo, fakePackage } from './fake-io.mjs';

const FILE_A = 'packages/astro/src/A.astro';
const FILE_B = 'packages/astro/src/B.astro';
const BASE = 'base\n';

const lockFile = (source, text = BASE) => ({
  source,
  path: `src/ds/${source.split('/').pop()}`,
  sha256: sha256(text),
});

/** Projet avec un élément `stack` éjecté (A, B) ; `options` ajuste copie et paquet. */
function setup(options = {}) {
  const defaults = {
    version: '1.2.3',
    lockVersion: '1.2.3',
    pkgFiles: [FILE_A, FILE_B],
    pkg: {},
    copy: {},
  };
  const { version, lockVersion, pkgFiles: listed, pkg, copy } = { ...defaults, ...options };
  const files = {};
  const sources = { 'src/A.astro': BASE, 'src/B.astro': BASE, ...pkg };
  fakePackage(files, [{ name: 'stack', files: listed.map((path) => ({ path })) }], {
    version,
    sources,
  });
  const entry = {
    package: '@paulperigault/astro',
    version: lockVersion,
    files: [lockFile(FILE_A), lockFile(FILE_B)],
  };
  files[`/projet/${LOCK_FILE}`] = JSON.stringify({ lockfileVersion: 1, items: { stack: entry } });
  files['/projet/src/ds/A.astro'] = BASE;
  files['/projet/src/ds/B.astro'] = BASE;
  const env = fakeIo(files);
  for (const [name, text] of Object.entries(copy)) {
    const path = `/projet/src/ds/${name}`;
    if (text === null) Reflect.deleteProperty(files, path);
    else files[path] = text;
  }
  return env;
}

const diff = (env, name = 'stack') => run({ positionals: [name] }, { io: env.io });

describe('diff', () => {
  it('identique : code 0', () => {
    const env = setup();
    expect(diff(env)).toBe(0);
    expect(env.out).toEqual(['stack : copie 1.2.3, paquet 1.2.3', 'stack : identique au paquet']);
  });

  it('modifié local', () => {
    const env = setup({ copy: { 'A.astro': 'mien\n' } });
    expect(diff(env)).toBe(1);
    expect(env.out[1]).toBe('modifié (local) src/A.astro');
  });

  it('modifié paquet', () => {
    const env = setup({ pkg: { 'src/B.astro': 'amont\n' } });
    expect(diff(env)).toBe(1);
    expect(env.out.slice(1)).toEqual(['modifié (paquet) src/B.astro']);
  });

  it('modifié des deux côtés', () => {
    const env = setup({ pkg: { 'src/A.astro': 'amont\n' }, copy: { 'A.astro': 'mien\n' } });
    expect(diff(env)).toBe(1);
    expect(env.out[1]).toBe('modifié (local, paquet) src/A.astro');
  });

  it('ajouté : nouveau fichier amont, ou copie supprimée', () => {
    const added = 'packages/astro/src/C.astro';
    const upstream = setup({ pkgFiles: [FILE_A, FILE_B, added], pkg: { 'src/C.astro': 'c\n' } });
    expect(diff(upstream)).toBe(1);
    expect(upstream.out.slice(1)).toEqual(['ajouté src/C.astro']);
    const deleted = setup({ copy: { 'B.astro': null } });
    expect(diff(deleted)).toBe(1);
    expect(deleted.out.slice(1)).toEqual(['ajouté src/B.astro']);
  });

  it('supprimé : absent du paquet, sortie triée', () => {
    const env = setup({ pkgFiles: [FILE_A], copy: { 'A.astro': 'mien\n' } });
    expect(diff(env)).toBe(1);
    expect(env.out.slice(1)).toEqual(['modifié (local) src/A.astro', 'supprimé src/B.astro']);
  });

  it('versions différentes dans l’en-tête', () => {
    const env = setup({ version: '2.0.0', lockVersion: '1.0.0' });
    expect(diff(env)).toBe(0);
    expect(env.out[0]).toBe('stack : copie 1.0.0, paquet 2.0.0');
  });

  it('élément non éjecté ou positionnels faux : code 2', () => {
    const env = setup();
    expect(diff(env, 'button')).toBe(2);
    expect(env.err).toEqual(["élément non éjecté : eject button d'abord"]);
    expect(run({ positionals: [] }, { io: env.io })).toBe(2);
    expect(run({ positionals: ['a', 'b'] }, { io: env.io })).toBe(2);
  });

  it('nom insensible à la casse, élément du registre retrouvé', () => {
    const env = setup({ copy: { 'A.astro': 'mien\n' } });
    expect(diff(env, 'Stack')).toBe(1);
    expect(env.out).toEqual(['stack : copie 1.2.3, paquet 1.2.3', 'modifié (local) src/A.astro']);
  });

  it('n’écrit rien', () => {
    const env = setup({ copy: { 'A.astro': 'mien\n' } });
    const before = JSON.stringify(env.files);
    diff(env);
    expect(JSON.stringify(env.files)).toBe(before);
  });
});
