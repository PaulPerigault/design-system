import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../src/lib/contrast.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const { pairs } = read('../src/roles.json');
const THEMES = ['light', 'dark'];
const sources = Object.fromEntries(
  THEMES.map((theme) => [theme, read(`../src/tokens/${theme}.tokens.json`)]),
);

/** Valeur DTCG d'un rôle (`color.status.passed`), ou undefined s'il n'existe pas. */
function roleValue(theme, role) {
  const node = role.split('.').reduce((current, key) => current?.[key], sources[theme]);
  return node?.$value;
}

/** Couleur DTCG OKLCH → { l, c, h } pour `contrastRatio`. */
function toColor(theme, role) {
  const [l, c, h] = roleValue(theme, role).components;
  return { l, c, h };
}

const roles = [...new Set(pairs.flatMap(({ fg, bg }) => [fg, bg]))];
const cases = THEMES.flatMap((theme) => pairs.map((pair) => ({ theme, ...pair })));

describe('matrice des rôles', () => {
  it.each(THEMES)('%s : chaque rôle de la matrice existe', (theme) => {
    for (const role of roles) {
      expect(roleValue(theme, role)?.colorSpace, `${theme} : ${role}`).toBe('oklch');
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
