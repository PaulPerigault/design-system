import { describe, expect, it } from 'vitest';
import { defaults, name, run } from '../src/application/check-scene.ts';
import { GuardUsageError } from '../src/errors.ts';
import { fakeIo } from './fake-io.ts';

const TOKENS = JSON.stringify({ base: { '--pp-duration-base': '160ms' }, themes: {} });
const options = {
  roots: ['crates', 'packages'],
  extensions: ['.rs', '.ts', '.glsl'],
  themeFiles: ['packages/p/src/constants.ts'],
  tokens: 'tokens.json',
};
const base = {
  'tokens.json': TOKENS,
  'packages/p/src/constants.ts': "const T = '--pp-duration-base';",
};

describe('contrat', () => {
  it('expose nom et défauts neutres pour un site consommateur', () => {
    expect(name).toBe('scene');
    expect(defaults.roots).toEqual(['src']);
    expect(defaults.themeFiles).toEqual([]);
  });
});

describe('run', () => {
  it('passe sur une source sans littéral', () => {
    const { io, out } = fakeIo({ ...base, 'crates/c/src/a.rs': 'fn f() -> f32 { 1.0 }' });
    expect(run(options, io)).toBe(0);
    expect(out.at(-1)).toMatch(/^scene : OK/);
  });

  it('échoue sur une couleur, une durée et une courbe, avec fichier et ligne', () => {
    const { io, err } = fakeIo({
      ...base,
      'packages/p/src/a.ts': "const a = 1;\nconst c = '#336699';",
      'crates/c/src/b.rs': 'const D: &str = "160ms";',
      'crates/c/src/shaders/f.glsl': 'x = vec3(0.2, 0.4, 0.6);',
      'packages/p/src/e.ts': "const e = 'cubic-bezier(0.2, 0, 0, 1)';",
    });
    expect(run(options, io)).toBe(1);
    expect(err.some((line) => /^packages\/p\/src\/a\.ts:2: couleur littérale/.test(line))).toBe(
      true,
    );
    expect(err.some((line) => /^crates\/c\/src\/b\.rs:1: durée littérale/.test(line))).toBe(true);
    expect(err.some((line) => /f\.glsl:1: couleur littérale/.test(line))).toBe(true);
    expect(err.some((line) => /e\.ts:1: courbe littérale/.test(line))).toBe(true);
  });

  it('ignore les tests : dossier test, fichier .test.ts, bloc #[cfg(test)]', () => {
    const { io } = fakeIo({
      ...base,
      'packages/p/test/a.ts': "const c = '#336699';",
      'packages/p/src/b.test.ts': "const c = 'rgb(1, 2, 3)';",
      'crates/c/src/lib.rs': "fn f() {}\n#[cfg(test)]\nmod t { const C: &str = '#336699'; }\n",
    });
    expect(run(options, io)).toBe(0);
  });

  it('signale un jeton du thème absent de tokens.json', () => {
    const { io, err } = fakeIo({
      ...base,
      'packages/p/src/constants.ts': "const T = '--pp-duration-base';\nconst U = '--pp-nope';",
    });
    expect(run(options, io)).toBe(1);
    expect(err).toEqual([
      'packages/p/src/constants.ts:2: jeton inconnu « --pp-nope » : absent de tokens.json',
    ]);
  });

  it('refuse de contrôler les jetons sans tokens.json', () => {
    const { io } = fakeIo({ 'packages/p/src/constants.ts': "const T = '--pp-x';" });
    expect(() => run(options, io)).toThrow(GuardUsageError);
  });

  it('ne lit pas les jetons quand aucun fichier de thème n’est déclaré', () => {
    const { io } = fakeIo({ 'src/a.ts': 'const a = 1;' });
    expect(run({ ...defaults }, io)).toBe(0);
  });
});
