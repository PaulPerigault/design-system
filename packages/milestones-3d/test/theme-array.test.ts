import { describe, expect, it } from 'vitest';
import { themeToArray } from '../src/raw-theme.ts';
import { readThemeWith } from '../src/theme.ts';
import { SAMPLES } from './fixtures/samples.ts';
import { probeFor } from './support-theme.ts';

describe('thème pour le .wasm', () => {
  it('34 nombres : sept couleurs de quatre, deux durées, quatre points de contrôle', () => {
    const [sample] = SAMPLES;
    if (!sample) throw new Error('aucun relevé');
    const array = themeToArray(readThemeWith('r', () => probeFor(sample, 'light').probe));
    expect(array).toHaveLength(34);
    expect(Array.from(array.slice(0, 4))).toEqual([
      1,
      expect.closeTo(0.985, 5),
      expect.closeTo(0.004, 5),
      expect.closeTo(270.7, 3),
    ]);
    expect(Array.from(array.slice(28))).toEqual([160, 100, expect.closeTo(0.2, 5), 0, 0, 1]);
    // paper en dernier (indices 24 à 27) : espace OKLCH puis clarté du fond clair.
    expect(array[24]).toBe(1);
    expect(array[25]).toBeCloseTo(0.985, 5);
  });

  it('une couleur sRGB porte l’étiquette d’espace 0', () => {
    const [sample] = SAMPLES;
    if (!sample) throw new Error('aucun relevé');
    const base = readThemeWith('r', () => probeFor(sample, 'light').probe);
    const array = themeToArray({
      ...base,
      colors: { ...base.colors, bg: { space: 'srgb', r: 1, g: 0.5, b: 0 } },
    });
    expect(Array.from(array.slice(0, 4))).toEqual([0, 1, 0.5, 0]);
  });
});
