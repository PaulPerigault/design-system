import { describe, expect, it } from 'vitest';
import { defaults } from '../src/application/check-architecture.ts';
import { ringOf, ringViolation } from '../src/domain/architecture/rings.ts';
import { importsDetailed, importsOf } from '../src/domain/layers/imports.ts';

const config = { ...defaults, roots: ['pkg/src'] };
const D = 'pkg/src/domain/a.ts';
const A = 'pkg/src/application/b.ts';
const I = 'pkg/src/infrastructure/c.ts';
const ref = (specifier: string, typeOnly = false) => ({ specifier, typeOnly });

describe('importsDetailed', () => {
  it('distingue import type, import de valeur et export type', () => {
    const text = "import type { A } from 'a';\nimport { b } from 'b';\nexport type { C } from 'c';";
    expect(importsDetailed(text).map((i) => [i.specifier, i.typeOnly])).toEqual([
      ['a', true],
      ['b', false],
      ['c', true],
    ]);
  });

  it('importsOf garde sa forme : spécificateur et ligne seulement', () => {
    expect(importsOf("import type { A } from 'a';")).toEqual([{ specifier: 'a', line: 1 }]);
  });
});

describe('ringOf', () => {
  it('lit le premier dossier sous la racine', () => {
    expect([D, A, I].map((path) => ringOf(config, path))).toEqual([0, 1, 2]);
  });

  it('rend -1 hors racine, hors anneau et à la racine', () => {
    const paths = [
      'other/src/domain/a.ts',
      'pkg/src/errors.ts',
      'pkg/src/lib/a.ts',
      'pkg/srcx/a.ts',
    ];
    expect(paths.map((path) => ringOf(config, path))).toEqual([-1, -1, -1, -1]);
  });

  it('accepte des chemins Windows et des racines avec ./', () => {
    expect(ringOf({ ...config, roots: ['./pkg/src/'] }, 'pkg\\src\\domain\\a.ts')).toBe(0);
  });
});

describe('ringViolation', () => {
  it('refuse un import relatif vers un anneau plus externe', () => {
    expect(ringViolation(config, D, ref('../application/b.ts'))).toContain(
      "l'anneau « domain » importe « application »",
    );
    expect(ringViolation(config, A, ref('../infrastructure/c.ts'))).toContain('sens refusé');
    expect(ringViolation(config, D, ref('../infrastructure/c.ts'))).toContain('« infrastructure »');
  });

  it('refuse aussi un import de type vers un anneau externe', () => {
    expect(ringViolation(config, D, ref('../application/b.ts', true))).not.toBeNull();
  });

  it('permet vers l’intérieur, dans l’anneau et vers un fichier hors anneau', () => {
    const ok = [
      [A, '../domain/a.ts'],
      [I, '../application/b.ts'],
      [I, '../domain/a.ts'],
      [D, './other.ts'],
      [D, '../errors.ts'],
    ] as const;
    expect(ok.map(([file, spec]) => ringViolation(config, file, ref(spec)))).toEqual(
      ok.map(() => null),
    );
  });

  it('refuse node:* d’E/S et les paquets dans les anneaux internes', () => {
    expect(ringViolation(config, D, ref('node:fs'))).toContain('réservé à « infrastructure »');
    expect(ringViolation(config, A, ref('node:process'))).not.toBeNull();
    expect(ringViolation(config, D, ref('@pp/tokens/contrast'))).toContain('@pp/tokens/contrast');
  });

  it('permet node:* sans E/S, les types et les paquets listés', () => {
    expect(ringViolation(config, D, ref('node:path'))).toBeNull();
    expect(ringViolation(config, D, ref('node:fs', true))).toBeNull();
    const allowed = { ...config, allowPackages: ['@pp/tokens'] };
    expect(ringViolation(allowed, D, ref('@pp/tokens/contrast'))).toBeNull();
    expect(ringViolation(allowed, D, ref('@pp/tokensx'))).not.toBeNull();
  });

  it('laisse l’anneau externe et les fichiers hors anneau libres', () => {
    expect(ringViolation(config, I, ref('node:fs'))).toBeNull();
    expect(ringViolation(config, I, ref('eslint'))).toBeNull();
    expect(ringViolation(config, 'pkg/src/index.ts', ref('node:fs'))).toBeNull();
  });

  it('ignore ce qui n’est pas un spécificateur (extrait de commentaire ou de gabarit)', () => {
    expect(ringViolation(config, D, ref('<specifier>'))).toBeNull();
    expect(ringViolation(config, D, ref('${specifier}'))).toBeNull();
    expect(ringViolation(config, D, ref('node:fs'))).not.toBeNull();
  });
});
