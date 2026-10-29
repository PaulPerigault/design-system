import { describe, expect, it } from 'vitest';
import tokens from '../../generated/tokens.json' with { type: 'json' };
import { deriveOverrides } from '../../src/customize/derive-overrides.ts';
import { parseOklch } from '../../src/lib/color.ts';
import { contrastRatio } from '../../src/lib/contrast.ts';
import type { Theme, ThemeBase } from '../../src/palette/domain/types.ts';
import { themeBaseFromTokens } from '../../src/palette/infrastructure/theme-base.ts';
import { DEFAULT_HUE, TWELVE_HUES } from './helpers.ts';

function baseOf(theme: Theme): ThemeBase {
  const result = themeBaseFromTokens(tokens, theme);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}
const bases = { light: baseOf('light'), dark: baseOf('dark') };
const SERIES = [1, 2, 3, 4, 5, 6];

describe('deriveOverrides', () => {
  it.each([DEFAULT_HUE, ...TWELVE_HUES])('teinte %s : deux thèmes, accent et séries', (hue) => {
    const result = deriveOverrides(hue, bases);
    if (!result.ok) throw new Error(result.error.message);
    for (const theme of ['light', 'dark'] as const) {
      const variables = result.value[theme];
      const accent = variables['--pp-color-accent'] ?? '';
      const onAccent = variables['--pp-color-on-accent'] ?? '';
      expect(variables['--pp-chart-1']).toBe(accent);
      expect(contrastRatio(parseOklch(onAccent), parseOklch(accent))).toBeGreaterThanOrEqual(4.5);
      for (const index of SERIES) expect(variables[`--pp-chart-${index}`]).toMatch(/^oklch\(/);
      expect(variables['--pp-chart-seq-7']).toBeDefined();
      expect(variables['--pp-chart-div-7']).toBeDefined();
    }
  });

  it('refuse un texte sur accent trop pâle, avec la teinte et le rapport mesuré', () => {
    const pale = { ...bases.light, onAccent: { l: 0.6, c: 0, h: 0 } };
    const result = deriveOverrides(145, { ...bases, light: pale });
    expect(result).toMatchObject({ ok: false, error: { code: 'build.contrast-failed' } });
    const message = result.ok ? '' : result.error.message;
    expect(message).toContain('Teinte 145');
    expect(message).toMatch(/\d+\.\d{2}:1/);
  });

  it('une base invalide donne une erreur de dérivation, jamais un throw', () => {
    const broken = { ...bases.dark, accent: { l: Number.NaN, c: 0.1, h: 0 } };
    expect(deriveOverrides(145, { ...bases, dark: broken })).toMatchObject({
      ok: false,
      error: { code: 'build.derivation-failed' },
    });
  });
});
