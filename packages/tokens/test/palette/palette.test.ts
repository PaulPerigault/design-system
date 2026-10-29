import { contrastRatio } from '../../src/lib/contrast.ts';
import { describe, expect, it } from 'vitest';
import { minPairDistance, minStepDistance } from '../../src/palette/domain/color/vision.ts';
import {
  MIN_CATEGORICAL_DELTA,
  MIN_GRAPHIC_CONTRAST,
  MIN_STEP_DELTA,
} from '../../src/palette/domain/thresholds.ts';
import { DEFAULT_HUE, HUES, THEMES, baseOf, palettesOf } from './palette-helpers.ts';

describe.each(THEMES)('palettes dérivées, thème %s', (theme) => {
  const base = baseOf(theme);

  it.each(HUES)('teinte %s : catégorielle ΔE00 ≥ 10 sous trois daltonismes', (hue) => {
    const { categorical } = palettesOf(hue, theme);
    expect(categorical).toHaveLength(6);
    expect(minPairDistance(categorical)).toBeGreaterThanOrEqual(MIN_CATEGORICAL_DELTA);
  });

  it.each(HUES)('teinte %s : séquentielle et divergente, pas voisins ΔE00 ≥ 3', (hue) => {
    const { sequential, diverging } = palettesOf(hue, theme);
    expect(sequential).toHaveLength(7);
    expect(minStepDistance(sequential)).toBeGreaterThanOrEqual(MIN_STEP_DELTA);
    expect(diverging).toHaveLength(7);
    expect(minStepDistance(diverging)).toBeGreaterThanOrEqual(MIN_STEP_DELTA);
  });

  it.each(HUES)('teinte %s : les couleurs de série tiennent 3:1 contre le fond', (hue) => {
    for (const color of palettesOf(hue, theme).categorical) {
      expect(contrastRatio(color, base.bg)).toBeGreaterThanOrEqual(MIN_GRAPHIC_CONTRAST);
    }
  });

  it.each(HUES)('teinte %s : l’accent garde la clarté du système, le texte dessus 4,5:1', (hue) => {
    const { accent, onAccent, categorical } = palettesOf(hue, theme);
    expect(accent.l).toBe(base.accent.l);
    expect(accent.h).toBeCloseTo(hue, 6);
    expect(accent.c).toBeLessThanOrEqual(base.accent.c);
    expect(categorical[0]).toEqual(accent);
    expect(contrastRatio(onAccent, accent)).toBeGreaterThanOrEqual(4.5);
  });

  it('la séquentielle est monotone en clarté et finit sur l’accent', () => {
    const { sequential, accent } = palettesOf(DEFAULT_HUE, theme);
    const lightness = sequential.map((color) => color.l);
    const sorted = [...lightness].sort((a, b) => (theme === 'light' ? b - a : a - b));
    expect(lightness).toEqual(sorted);
    expect(sequential.at(-1)).toEqual(accent);
  });

  it('la divergente passe par le neutre de `--pp-color-line`', () => {
    const { diverging } = palettesOf(DEFAULT_HUE, theme);
    expect(diverging[3]).toEqual(base.line);
  });

  it('est déterministe', () => {
    expect(palettesOf(DEFAULT_HUE, theme)).toEqual(palettesOf(DEFAULT_HUE, theme));
  });
});
