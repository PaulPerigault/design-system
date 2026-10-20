import { describe, expect, it } from 'vitest';
import { countLines, findOversized, MAX_FILE_LINES } from './check-size.mjs';
import { lockfileProblems, localSpecs, run } from './check-lockfile.mjs';

describe('check-size', () => {
  it('compte les lignes avec ou sans saut final', () => {
    expect(countLines('a\nb\n')).toBe(2);
    expect(countLines('a\nb')).toBe(2);
  });

  it('signale un fichier de 121 lignes, pas un de 120', () => {
    const texts = { ok: 'x\n'.repeat(MAX_FILE_LINES), long: 'x\n'.repeat(MAX_FILE_LINES + 1) };
    expect(findOversized(['ok', 'long'], (file) => texts[file])).toEqual([
      { file: 'long', lines: MAX_FILE_LINES + 1 },
    ]);
  });
});

describe('check-lockfile', () => {
  const npm = (name) => ({ resolved: `https://registry.npmjs.org/${name}/-/${name}-1.0.0.tgz` });

  it('accepte npmjs, les liens du monorepo et les paquets locaux', () => {
    const lock = {
      packages: {
        '': {},
        'packages/tokens': { version: '0.0.0' },
        'node_modules/a': npm('a'),
        'node_modules/@paulperigault/tokens': { link: true, resolved: 'packages/tokens' },
      },
    };
    expect(lockfileProblems(lock)).toEqual([]);
  });

  it('refuse une source hors npmjs ou absente', () => {
    const lock = {
      packages: {
        'node_modules/a': { resolved: 'https://nexus.example.org/repository/npm/a-1.0.0.tgz' },
        'node_modules/b': {},
      },
    };
    expect(lockfileProblems(lock)).toEqual([
      'node_modules/a : source hors npmjs (https://nexus.example.org/repository/npm/a-1.0.0.tgz)',
      'node_modules/b : aucune source « resolved »',
    ]);
  });

  it('refuse les dépendances file: et link:', () => {
    const manifest = {
      dependencies: { x: 'file:../x' },
      devDependencies: { y: 'link:../y', z: '^1' },
    };
    expect(localSpecs(manifest, 'p.json')).toEqual([
      'p.json : dependencies.x = file:../x',
      'p.json : devDependencies.y = link:../y',
    ]);
  });

  it('run lit le lockfile et chaque manifeste par le lecteur injecté', () => {
    const files = {
      'package-lock.json': JSON.stringify({ packages: { 'node_modules/a': npm('a') } }),
      'package.json': JSON.stringify({ devDependencies: { a: '^1' } }),
      'packages/p/package.json': JSON.stringify({ dependencies: { b: 'link:../b' } }),
    };
    const problems = run({ read: (file) => files[file], manifests: ['packages/p/package.json'] });
    expect(problems).toEqual(['packages/p/package.json : dependencies.b = link:../b']);
  });
});
