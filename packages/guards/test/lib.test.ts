import { describe, expect, it } from 'vitest';
import { SKIPPED_DIRS, listFiles } from '../src/application/files.ts';
import { lineOf } from '../src/domain/text.ts';
import { matchesAny, matchesPath, normalizePath } from '../src/domain/paths.ts';
import { GuardUsageError } from '../src/errors.ts';
import { report } from '../src/application/report.ts';
import { fakeIo } from './fake-io.ts';

describe('listFiles', () => {
  const files = {
    'src/b.CSS': '',
    'src/a.css': '',
    'src/deep/c.css': '',
    'src/x.txt': '',
    'node_modules/p/i.css': '',
    'src/dist/o.css': '',
    'solo.css': '',
  };

  it('est récursif, insensible à la casse, trié, sans doublon', () => {
    const { io } = fakeIo(files);
    expect(listFiles(io, ['src', './src/'], { extensions: ['.css'] })).toEqual([
      'src/a.css',
      'src/b.CSS',
      'src/deep/c.css',
    ]);
  });

  it('ignore les dossiers exclus, une racine absente, garde un fichier racine', () => {
    const { io } = fakeIo(files);
    const roots = ['.', 'absent', 'solo.css', 'src/x.txt'];
    const found = listFiles(io, roots, { extensions: ['.css'] });
    expect(found).toContain('solo.css');
    expect(found.some((f) => f.startsWith('node_modules') || f.includes('/dist/'))).toBe(false);
    expect(found).not.toContain('src/x.txt');
    expect(SKIPPED_DIRS).toContain('playwright-report');
  });
});

describe('lineOf', () => {
  it('compte les lignes depuis 1', () => {
    expect([0, 2, 4].map((index) => lineOf('a\nb\nc', index))).toEqual([1, 2, 3]);
  });
});

describe('paths', () => {
  it('normalise', () => {
    expect(normalizePath('.\\src\\a/')).toBe('src/a');
    expect(normalizePath('./a/b')).toBe('a/b');
  });

  it('compare par segments entiers', () => {
    expect(matchesPath('src/media/a.astro', 'src/media')).toBe(true);
    expect(matchesPath('packages/astro/src/media/a.astro', 'src/media')).toBe(true);
    expect(matchesPath('src/mediakit/a.astro', 'src/media')).toBe(false);
    expect(matchesPath('src/media/a.astro', 'src/media/a.astro')).toBe(true);
    expect(matchesPath('src/a.astro', '')).toBe(false);
  });

  it('matchesAny', () => {
    expect(matchesAny('a/b/c.css', ['x', 'b'])).toBe(true);
    expect(matchesAny('a/b/c.css', ['x'])).toBe(false);
  });
});

describe('report', () => {
  it('retourne 0 et résume sans problème', () => {
    const { io, out, err } = fakeIo({});
    expect(report(io, { name: 'size', problems: [], checked: 3 })).toBe(0);
    expect(out).toEqual(['size : OK (3 fichiers)']);
    expect(err).toEqual([]);
  });

  it('retourne 1 et formate fichier:ligne', () => {
    const { io, out, err } = fakeIo({});
    const problems = [
      { file: 'a.css', line: 4, message: 'm' },
      { file: 'b.css', message: 'n' },
    ];
    expect(report(io, { name: 'size', problems, checked: 5 })).toBe(1);
    expect(err).toEqual(['a.css:4: m', 'b.css: n']);
    expect(out).toEqual(['size : 2 problème(s) sur 5 fichiers']);
  });

  it("GuardUsageError est une Error d'usage", () => {
    const error = new GuardUsageError('x');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('GuardUsageError');
  });
});
