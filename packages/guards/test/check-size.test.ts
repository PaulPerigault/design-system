import { describe, expect, it } from 'vitest';
import { GuardUsageError } from '../src/lib/report.ts';
import { cliOptions, countLines, defaults, name, run } from '../src/check-size.ts';
import { fakeIo } from './fake-io.ts';

const lines = (count: number) => `${'a\n'.repeat(count)}`;

describe('contrat', () => {
  it('expose nom, défauts et descripteurs parseArgs', () => {
    expect(name).toBe('size');
    expect(defaults).toEqual({
      max: 120,
      extensions: ['.ts', '.astro', '.css', '.mjs'],
      roots: ['src'],
    });
    expect(cliOptions.max?.type).toBe('string');
    expect(cliOptions.ext).toEqual({ type: 'string', multiple: true });
  });
});

describe('countLines', () => {
  it('ignore le saut de ligne final', () => {
    expect([countLines('a\nb'), countLines('a\nb\n'), countLines('')]).toEqual([2, 2, 1]);
  });
});

describe('run', () => {
  const files = {
    'src/ok.ts': lines(120),
    'src/long.css': lines(121),
    'src/deep/long.mjs': 'x\n'.repeat(130).trimEnd(),
    'src/notes.md': lines(500),
  };

  it('signale les fichiers trop longs et retourne 1', () => {
    const { io, err } = fakeIo(files);
    expect(run({ ...defaults }, io)).toBe(1);
    expect(err).toEqual([
      'src/deep/long.mjs: 130 lignes (max 120)',
      'src/long.css: 121 lignes (max 120)',
    ]);
  });

  it('retourne 0 sous la limite', () => {
    const { io, out } = fakeIo({ 'src/a.ts': lines(3) });
    expect(run({ ...defaults }, io)).toBe(0);
    expect(out).toEqual(['size : OK (1 fichiers)']);
  });

  it('applique max, un nombre en chaîne et les racines positionnelles', () => {
    const { io, err } = fakeIo({ 'lib/a.ts': lines(5), 'src/b.ts': lines(9) });
    expect(run({ ...defaults, max: '4', roots: ['lib'] }, io)).toBe(1);
    expect(err).toEqual(['lib/a.ts: 5 lignes (max 4)']);
  });

  it('--ext remplace les extensions', () => {
    const { io, err } = fakeIo({ 'src/a.ts': lines(5), 'src/b.md': lines(5) });
    expect(run({ ...defaults, max: 2, ext: ['.md'] }, io)).toBe(1);
    expect(err).toEqual(['src/b.md: 5 lignes (max 2)']);
  });

  it.each([0, -1, 1.5, 'abc', '', Number.NaN])('refuse max = %j', (max) => {
    const { io } = fakeIo(files);
    expect(() => run({ ...defaults, max }, io)).toThrow(GuardUsageError);
  });
});
