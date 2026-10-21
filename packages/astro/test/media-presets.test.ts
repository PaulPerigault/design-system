import tokens from '@paulperigault/tokens/tokens.json';
import { describe, expect, it } from 'vitest';
import {
  DENSITIES,
  FORMATS,
  ROOT_FONT_PX,
  fallbackFormat,
  mediaFor,
  qualityFor,
  ratioValue,
  remOf,
  sizesFor,
  widthsFor,
} from '../src/media/presets';
import type { MediaLayout } from '../src/media/types';

const base: Record<string, string> = tokens.base;
const rem = (name: string): number => parseFloat(base[name] ?? 'NaN');
const page = rem('--pp-size-page');
const measure = rem('--pp-size-measure');
const LAYOUTS: MediaLayout[] = ['page', 'measure', 'half', 'third', 'avatar'];

describe('presets : tokens de référence', () => {
  it('lit les largeurs en rem dans tokens.json', () => {
    expect(base['--pp-size-page']).toBe('72rem');
    expect(base['--pp-size-measure']).toBe('38rem');
    expect(base['--pp-space-3xl']).toBe('6rem');
    expect(remOf('--pp-size-page')).toBe(page);
    expect(ROOT_FONT_PX).toBe(16);
    expect(DENSITIES).toEqual([1, 2]);
  });

  it('lève si un token manque ou n’est pas en rem', () => {
    expect(() => remOf('--pp-size-page', {})).toThrow(/manquant.*--pp-size-page/);
    expect(() => remOf('--pp-size-page', { '--pp-size-page': '1152px' })).toThrow(/rem/);
    expect(() => sizesFor('page', { '--pp-size-measure': '38rem' })).toThrow(/manquant/);
    expect(() => remOf('toString', {})).toThrow(/manquant/);
  });
});

describe('sizesFor', () => {
  it('construit chaque chaîne depuis les tokens', () => {
    expect(sizesFor('page')).toBe('(min-width: 72rem) 72rem, 100vw');
    expect(sizesFor('measure')).toBe('(min-width: 38rem) 38rem, 100vw');
    expect(sizesFor('half')).toBe('(min-width: 72rem) 36rem, 100vw');
    expect(sizesFor('third')).toBe('(min-width: 72rem) 24rem, 100vw');
    expect(sizesFor('avatar')).toBe('6rem');
    expect(sizesFor('half')).toBe(`(min-width: ${page}rem) ${page / 2}rem, 100vw`);
  });

  it('suit un changement de token', () => {
    const custom = { '--pp-size-page': '78rem', '--pp-size-measure': '40rem' };
    expect(sizesFor('third', custom)).toBe('(min-width: 78rem) 26rem, 100vw');
    expect(sizesFor('measure', custom)).toBe('(min-width: 40rem) 40rem, 100vw');
  });
});

describe('widthsFor', () => {
  const large = 4000;
  it('donne densités × référence, plus × mesure pour les fluides', () => {
    expect(widthsFor('page', large)).toEqual([608, 1152, 1216, 2304]);
    expect(widthsFor('measure', large)).toEqual([608, 1216]);
    expect(widthsFor('half', large)).toEqual([576, 608, 1152, 1216]);
    expect(widthsFor('third', large)).toEqual([384, 608, 768, 1216]);
    expect(widthsFor('avatar', large)).toEqual([96, 192]);
    expect(widthsFor('page', large)).toContain(page * ROOT_FONT_PX);
    expect(widthsFor('page', large)).toContain(measure * ROOT_FONT_PX * 2);
  });

  it('plafonne à la largeur source, sans jamais rendre une liste vide', () => {
    expect(widthsFor('page', 1200)).toEqual([608, 1152]);
    expect(widthsFor('page', 608)).toEqual([608]);
    expect(widthsFor('page', 400)).toEqual([400]);
    expect(widthsFor('avatar', 50)).toEqual([50]);
  });

  it('rend des entiers triés et uniques pour chaque emplacement', () => {
    for (const layout of LAYOUTS) {
      const widths = widthsFor(layout, large);
      expect(widths.length).toBeGreaterThan(0);
      expect(widths.every(Number.isInteger)).toBe(true);
      expect(widths).toEqual([...new Set(widths)].sort((a, b) => a - b));
    }
  });

  it('refuse une largeur source invalide', () => {
    expect(() => widthsFor('page', 0)).toThrow(RangeError);
    expect(() => widthsFor('page', 12.5)).toThrow(RangeError);
  });
});

describe('qualité, formats, médias, ratios', () => {
  it('qualité par nature', () => {
    expect(qualityFor('photo')).toBe(70);
    expect(qualityFor('capture')).toBe(90);
    expect(qualityFor('illustration')).toBe(80);
  });

  it('formats modernes et repli', () => {
    expect(FORMATS).toEqual(['avif', 'webp']);
    expect(fallbackFormat('photo')).toBe('jpg');
    expect(fallbackFormat('capture')).toBe('png');
    expect(fallbackFormat('illustration')).toBe('png');
  });

  it('requêtes médias depuis les tokens', () => {
    expect(mediaFor('narrow')).toBe('(width < 38rem)');
    expect(mediaFor('medium')).toBe('(width < 72rem)');
  });

  it('ratios lus dans --pp-ratio-*', () => {
    expect(ratioValue('portrait')).toBe(0.8);
    expect(ratioValue('square')).toBe(1);
    expect(ratioValue('landscape')).toBe(1.5);
    expect(ratioValue('wide')).toBe(1.7778);
    expect(ratioValue('wide')).toBe(Number(base['--pp-ratio-wide']));
    expect(() => ratioValue('wide', { '--pp-ratio-wide': 'auto' })).toThrow(/invalide/);
  });
});
