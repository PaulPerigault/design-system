import tokens from '../../generated/tokens.json' with { type: 'json' };
import { contrastRatio } from '../../src/lib/contrast.ts';
import { describe, expect, it } from 'vitest';
import { inkOn } from '../../src/palette/domain/ink.ts';
import { CATEGORICAL_COUNT, MIN_TEXT_CONTRAST } from '../../src/palette/domain/thresholds.ts';
import { seriesInksFromTokens } from '../../src/palette/infrastructure/series-ink.ts';
import { readThemeColor } from '../../src/palette/infrastructure/theme-base.ts';
import { baseOf, THEMES } from './palette-helpers.ts';

const dark = { l: 0.2, c: 0, h: 0 };
const light = { l: 0.98, c: 0, h: 0 };
const inks = { fg: dark, bg: light };

describe('inkOn', () => {
  it('choisit le texte clair sur un fond sombre et inversement', () => {
    expect(inkOn({ l: 0.3, c: 0, h: 0 }, inks)).toBe('bg');
    expect(inkOn({ l: 0.9, c: 0, h: 0 }, inks)).toBe('fg');
  });

  it('refuse (null) un fond où aucun neutre n’atteint 4,5:1', () => {
    const middle = { l: 0.57, c: 0, h: 0 };
    expect(Math.max(contrastRatio(dark, middle), contrastRatio(light, middle))).toBeLessThan(
      MIN_TEXT_CONTRAST,
    );
    expect(inkOn(middle, inks)).toBeNull();
  });

  it('accepte un seuil plus bas', () => {
    expect(inkOn({ l: 0.57, c: 0, h: 0 }, inks, 3)).not.toBeNull();
  });
});

describe('seriesInksFromTokens (jetons du dépôt)', () => {
  const result = seriesInksFromTokens(tokens, CATEGORICAL_COUNT);

  it('donne un neutre lisible aux six couleurs, dans les deux thèmes', () => {
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value).toHaveLength(CATEGORICAL_COUNT);
    for (const theme of THEMES) {
      const { fg, bg } = baseOf(theme);
      result.value.forEach((ink, index) => {
        const chosen = ink[theme];
        expect(chosen).not.toBeNull();
        const color = readThemeColor(tokens, theme, `--pp-chart-${index + 1}`);
        if (!color || !chosen) throw new Error(`${theme} ${index + 1}`);
        expect(contrastRatio(chosen === 'fg' ? fg : bg, color)).toBeGreaterThanOrEqual(
          MIN_TEXT_CONTRAST,
        );
      });
    }
  });

  it('change de neutre d’un thème à l’autre pour la série 6', () => {
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value[5]).toEqual({ light: 'fg', dark: 'bg' });
  });

  it('échoue (palette.bad-base) si une couleur de série manque', () => {
    const failed = seriesInksFromTokens(tokens, CATEGORICAL_COUNT + 1);
    expect(failed.ok).toBe(false);
    if (!failed.ok) expect(failed.error.code).toBe('palette.bad-base');
  });
});
