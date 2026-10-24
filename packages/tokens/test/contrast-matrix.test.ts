import { URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../src/lib/contrast.ts';
import { at, componentsOf, readJson } from './helpers.ts';

interface Pair {
  fg: string;
  bg: string;
  min: number;
  norm: string;
}

/** Valide la forme de `roles.json` à la lecture. */
function rolePairs(value: unknown): Pair[] {
  if (!Array.isArray(value)) throw new TypeError('roles.json : pairs doit être une liste.');
  return value;
}

const read = (path: string) => readJson(new URL(path, import.meta.url));
const pairs = rolePairs(read('../src/roles.json').pairs);
const THEMES = ['light', 'dark'];
const sources = Object.fromEntries(
  THEMES.map((theme) => [theme, read(`../src/tokens/${theme}.tokens.json`)]),
);

/** Valeur DTCG d'un rôle (`color.status.passed`), ou undefined s'il n'existe pas. */
function roleValue(theme: string, role: string): unknown {
  return at(sources[theme] ?? {}, `${role}.$value`);
}

/** Couleur DTCG OKLCH → { l, c, h } pour `contrastRatio`. */
function toColor(theme: string, role: string) {
  return componentsOf(roleValue(theme, role));
}

const roles = [...new Set(pairs.flatMap(({ fg, bg }) => [fg, bg]))];
const cases = THEMES.flatMap((theme) => pairs.map((pair) => ({ theme, ...pair })));

describe('matrice des rôles', () => {
  it.each(THEMES)('%s : chaque rôle de la matrice existe', (theme) => {
    for (const role of roles) {
      expect(at(sources[theme] ?? {}, `${role}.$value.colorSpace`), `${theme} : ${role}`).toBe(
        'oklch',
      );
    }
  });

  it('chaque paire déclare un seuil et une norme', () => {
    for (const { fg, bg, min, norm } of pairs) {
      expect(min, `${fg} sur ${bg}`).toBeGreaterThan(1);
      expect(norm, `${fg} sur ${bg}`).toMatch(/^WCAG /);
    }
  });
});

describe('contraste WCAG 2.2 (bloquant, sRGB rendu)', () => {
  it.each(cases)('$theme : $fg sur $bg ≥ $min', ({ theme, fg, bg, min }) => {
    expect(contrastRatio(toColor(theme, fg), toColor(theme, bg))).toBeGreaterThanOrEqual(min);
  });
});
