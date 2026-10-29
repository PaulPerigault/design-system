import { describe, expect, it } from 'vitest';
import { derivePalettes } from '../../src/palette/domain/derive.ts';
import { lightDarkTokens, paletteTokens } from '../../src/palette/domain/tokens.ts';
import { themeBaseFromTokens } from '../../src/palette/infrastructure/theme-base.ts';
import { DEFAULT_HUE, baseOf, palettesOf } from './palette-helpers.ts';

describe('dérivation : erreurs typées', () => {
  it('refuse une teinte non finie', () => {
    const result = derivePalettes(Number.NaN, 'light', baseOf('light'));
    expect(!result.ok && result.error.code).toBe('palette.bad-hue');
  });

  it('refuse des jetons non finis', () => {
    const base = { ...baseOf('light'), bg: { l: Number.NaN, c: 0, h: 0 } };
    const result = derivePalettes(DEFAULT_HUE, 'light', base);
    expect(!result.ok && result.error.code).toBe('palette.bad-base');
  });

  it('refuse un texte sur accent illisible', () => {
    const base = { ...baseOf('light'), onAccent: baseOf('light').accent };
    const result = derivePalettes(DEFAULT_HUE, 'light', base);
    expect(!result.ok && result.error.code).toBe('palette.contrast-failed');
  });

  it('normalise une teinte hors de [0, 360)', () => {
    expect(palettesOf(DEFAULT_HUE + 360, 'light').hue).toBeCloseTo(DEFAULT_HUE, 6);
    expect(palettesOf(-90, 'dark').hue).toBeCloseTo(270, 6);
  });
});

describe('variables CSS', () => {
  const light = palettesOf(DEFAULT_HUE, 'light');
  const dark = palettesOf(DEFAULT_HUE, 'dark');

  it('nomme accent, texte sur accent et trois palettes numérotées de 1', () => {
    const names = Object.keys(paletteTokens(light));
    expect(names).toHaveLength(2 + 6 + 7 + 7);
    expect(names).toContain('--pp-color-accent');
    expect(names).toContain('--pp-chart-1');
    expect(names).toContain('--pp-chart-seq-7');
    expect(names).toContain('--pp-chart-div-7');
  });

  it('reproduit l’accent actuel du système pour la teinte par défaut', () => {
    expect(paletteTokens(light)['--pp-color-accent']).toBe('oklch(47% 0.19 270.7)');
    expect(paletteTokens(dark)['--pp-color-accent']).toBe('oklch(78% 0.1 270.7)');
  });

  it('fusionne clair et sombre en light-dark()', () => {
    expect(lightDarkTokens(light, dark)['--pp-color-accent']).toBe(
      'light-dark(oklch(47% 0.19 270.7), oklch(78% 0.1 270.7))',
    );
  });
});

describe('themeBaseFromTokens', () => {
  it('refuse un tokens.json incomplet', () => {
    const result = themeBaseFromTokens({ themes: { light: {} } }, 'light');
    expect(!result.ok && result.error.code).toBe('palette.bad-base');
    expect(themeBaseFromTokens(null, 'dark').ok).toBe(false);
  });

  it('refuse une valeur OKLCH illisible', () => {
    const bad = { themes: { light: { '--pp-color-accent': { oklch: 'rouge' } } } };
    expect(themeBaseFromTokens(bad, 'light').ok).toBe(false);
  });
});
