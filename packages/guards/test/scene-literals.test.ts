import { describe, expect, it } from 'vitest';
import { isTestPath, neutralize, sceneHits } from '../src/domain/scene/literals.ts';
import { knownTokenNames, unknownThemeTokens } from '../src/domain/scene/theme-tokens.ts';

const rules = (text: string): string[] => sceneHits(text).map(({ rule }) => rule);

describe('sceneHits : ce qui est refusé', () => {
  it('refuse une couleur hexadécimale, fonctionnelle ou en triplet GLSL', () => {
    expect(rules("const c = '#336699';")).toEqual(['color-literal']);
    expect(rules('let c = "rgb(10, 20, 30)";')).toEqual(['color-literal']);
    expect(rules('const c = `oklch(0.5 0.1 270)`;')).toEqual(['color-literal']);
    expect(rules('out_color = vec4(0.2, 0.4, 0.6, 1.0);')).toEqual(['color-literal']);
  });

  it('refuse une durée littérale, entière ou décimale', () => {
    expect(rules("const t = '160ms';")).toEqual(['duration-literal']);
    expect(rules("const t = '.16s';")).toEqual(['duration-literal']);
    expect(rules("const t = '0.5s';")).toEqual(['duration-literal']);
  });

  it('refuse une courbe littérale', () => {
    expect(rules("const e = 'cubic-bezier(0.2, 0, 0, 1)';")).toEqual(['easing-literal']);
  });

  it('donne la ligne et un extrait', () => {
    const [hit] = sceneHits("const a = 1;\nconst b = 2;\nconst c = '#abc123';\n");
    expect(hit).toEqual({ rule: 'color-literal', line: 3, excerpt: '#abc123' });
  });
});

describe('sceneHits : ce qui passe', () => {
  it('laisse les noms de fonctions de couleur sans valeur littérale', () => {
    expect(rules('function oklch(parts: string[]) { return rgb(parts); }')).toEqual([]);
    expect(rules("const OPEN = 'cubic-bezier(';")).toEqual([]);
    expect(rules('const rest = parseColor(oklch(l, c, h));')).toEqual([]);
  });

  it('laisse le GLSL qui n’écrit pas de couleur', () => {
    const glsl =
      '#version 300 es\ngl_Position = u_mvp * vec4(a_position, 1.0);\nvec3 n = normalize(v);';
    expect(rules(glsl)).toEqual([]);
  });

  it('laisse les attributs Rust et les noms de constantes de durée', () => {
    expect(
      rules('#![forbid(unsafe_code)]\n#[derive(Debug)]\nconst TIMEOUT_MS: u32 = 2000;'),
    ).toEqual([]);
  });

  it('ignore les commentaires', () => {
    expect(rules("// couleur '#336699' en 160ms\n/* rgb(1, 2, 3) */ const a = 1;")).toEqual([]);
  });

  it('ignore le module de tests Rust en fin de fichier', () => {
    const rust = "fn f() {}\n#[cfg(test)]\nmod tests {\n  const C: &str = '#336699';\n}\n";
    expect(rules(rust)).toEqual([]);
  });

  it('garde les lignes et les index : un défaut après un commentaire garde sa ligne', () => {
    const text = "// a\n/* b\nc */\nconst x = '#336699';";
    expect(neutralize(text).split('\n')).toHaveLength(4);
    expect(sceneHits(text)[0]?.line).toBe(4);
  });
});

describe('isTestPath', () => {
  it('reconnaît les dossiers et fichiers de tests', () => {
    for (const path of [
      'packages/x/test/a.ts',
      'crates/c/tests/b.rs',
      'src/a.test.ts',
      'src/tests.rs',
    ]) {
      expect([path, isTestPath(path)]).toEqual([path, true]);
    }
    for (const path of ['src/theme.rs', 'src/contest.ts', 'src/latest/a.ts']) {
      expect([path, isTestPath(path)]).toEqual([path, false]);
    }
  });
});

describe('jetons du thème', () => {
  const known = knownTokenNames({
    base: { '--pp-duration-base': '160ms' },
    themes: { light: { '--pp-color-bg': {} }, dark: { '--pp-color-fg': {} } },
  });

  it('rassemble les jetons de base et des deux thèmes', () => {
    expect([...known].sort()).toEqual(['--pp-color-bg', '--pp-color-fg', '--pp-duration-base']);
    expect(knownTokenNames(null).size).toBe(0);
  });

  it('signale un jeton cité qui n’existe pas, avec sa ligne', () => {
    const text = "const A = {\n  bg: '--pp-color-bg',\n  nope: '--pp-color-nope',\n};";
    expect(unknownThemeTokens(text, known)).toEqual([{ name: '--pp-color-nope', line: 3 }]);
  });

  it('accepte une liste où tout existe', () => {
    expect(unknownThemeTokens("a: '--pp-duration-base'", known)).toEqual([]);
  });
});
