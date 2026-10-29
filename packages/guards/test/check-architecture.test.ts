import { describe, expect, it } from 'vitest';
import { cliOptions, defaults, name, run } from '../src/application/check-architecture.ts';
import type { Options } from '../src/domain/options.ts';
import { GuardUsageError } from '../src/errors.ts';
import { fakeIo } from './fake-io.ts';

const config = { ...defaults, roots: ['pkg/src'] };
const D = 'pkg/src/domain/a.ts';
const A = 'pkg/src/application/b.ts';
const I = 'pkg/src/infrastructure/c.ts';

function check(files: Record<string, string>, options: Options = config) {
  const { io, out, err } = fakeIo(files);
  return { code: run(options, io), out, err };
}

it('expose nom, défauts et descripteurs', () => {
  expect([name, cliOptions]).toEqual(['architecture', {}]);
  expect(defaults.rings).toEqual(['domain', 'application', 'infrastructure']);
});

describe('run', () => {
  it('accepte une arborescence conforme', () => {
    const { code, out } = check({
      [D]: "import { posix } from 'node:path';\nexport const a = 1;",
      [A]: "import { a } from '../domain/a.ts';\nexport const b = a;",
      [I]: "import { readFileSync } from 'node:fs';\nimport { b } from '../application/b.ts';",
      'pkg/src/errors.ts': "import 'node:fs';",
    });
    expect(code).toBe(0);
    expect(out).toEqual(['architecture : OK (3 fichiers)']);
  });

  it('signale fichier, ligne et sens', () => {
    const { code, err, out } = check({
      [D]: "export const a = 1;\nimport { c } from '../infrastructure/c.ts';",
      [A]: "import { readFileSync } from 'node:fs';",
      [I]: 'export const c = 1;',
    });
    expect(code).toBe(1);
    expect(err[1]).toContain(`${D}:2: l'anneau « domain » importe « infrastructure »`);
    expect(err[0]).toContain(`${A}:1: l'anneau « application » importe « node:fs »`);
    expect(out).toEqual(['architecture : 2 problème(s) sur 3 fichiers']);
  });

  it('refuse une arborescence sans anneau', () => {
    const { code, err } = check({ 'pkg/src/lib/a.ts': 'export const a = 1;' });
    expect(code).toBe(1);
    expect(err[0]).toContain("aucun fichier n'appartient à un anneau");
  });

  it('valide ses options à la frontière', () => {
    const files = { [D]: 'export const a = 1;' };
    expect(() => check(files, { ...defaults, roots: [] })).toThrow(GuardUsageError);
    expect(() => check(files, { ...config, pureNode: 'node:path' })).toThrow(
      'pureNode doit être une liste de chaînes',
    );
  });

  it('prend des anneaux et des extensions personnalisés', () => {
    const options = { ...config, rings: ['core', 'shell'], extensions: ['.mjs'] };
    const files = {
      'pkg/src/core/a.mjs': "import '../shell/b.mjs';",
      'pkg/src/shell/b.mjs': 'export {};',
      [D]: "import '../application/b.ts';",
    };
    expect(check(files, options).code).toBe(1);
    expect(check(files, options).err).toHaveLength(1);
  });
});
