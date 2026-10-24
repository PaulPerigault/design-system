import { describe, expect, it } from 'vitest';
import { hexToOklch } from '../src/lib/color.ts';
import { apcaLc, contrastRatio, relativeLuminance } from '../src/lib/contrast.ts';

const OUT_OF_GAMUT = 'oklch(0.7 0.4 140)';

describe('relativeLuminance', () => {
  it('noir 0, blanc 1, coefficients WCAG sur les primaires', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(relativeLuminance({ r: 1, g: 1, b: 1 })).toBeCloseTo(1, 12);
    expect(relativeLuminance({ r: 1, g: 0, b: 0 })).toBeCloseTo(0.2126, 12);
    expect(relativeLuminance({ r: 0, g: 1, b: 0 })).toBeCloseTo(0.7152, 12);
    expect(relativeLuminance({ r: 0, g: 0, b: 1 })).toBeCloseTo(0.0722, 12);
  });

  it('linéarise les canaux gamma', () => {
    expect(relativeLuminance({ r: 0.5, g: 0.5, b: 0.5 })).toBeCloseTo(0.214041, 6);
  });
});

describe('contrastRatio', () => {
  it('noir sur blanc = 21, identiques = 1', () => {
    expect(Math.abs(contrastRatio('#000000', '#ffffff') - 21)).toBeLessThan(1e-6);
    expect(contrastRatio('#3749c3', '#3749c3')).toBe(1);
  });

  it('ordre indifférent', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBe(contrastRatio('#000000', '#ffffff'));
    expect(contrastRatio('#777777', '#14161c')).toBe(contrastRatio('#14161c', '#777777'));
  });

  it('#777777 sur blanc ≈ 4.48', () => {
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });

  it('chaînes oklch(…) : texte et fond du thème ≈ 16.79', () => {
    const ratio = contrastRatio('oklch(0.215 0.016 270.7)', 'oklch(0.985 0.004 270.7)');
    expect(Math.abs(ratio - 16.79)).toBeLessThan(0.05);
  });

  it('objets { l, c, h } et formes équivalentes donnent le même rapport', () => {
    const fromObjects = contrastRatio(hexToOklch('#777777'), hexToOklch('#ffffff'));
    expect(fromObjects).toBeCloseTo(contrastRatio('#777777', '#ffffff'), 6);
    expect(contrastRatio('oklch(0% 0 0)', 'oklch(100% 0 0)')).toBeCloseTo(21, 6);
  });

  it('hors gamut : RangeError, sans rognage', () => {
    expect(() => contrastRatio(OUT_OF_GAMUT, '#ffffff')).toThrow(RangeError);
    expect(() => contrastRatio('#000000', { l: 0.7, c: 0.4, h: 140 })).toThrow(RangeError);
  });

  it('format inconnu : TypeError', () => {
    expect(() => contrastRatio('#fff', '#000000')).toThrow(TypeError);
    expect(() => contrastRatio('rgb(0 0 0)', '#000000')).toThrow(TypeError);
  });
});

describe('apcaLc (informatif)', () => {
  it('noir sur blanc ≈ 106.04', () => {
    expect(Math.abs(apcaLc('#000000', '#ffffff') - 106.04)).toBeLessThan(0.1);
  });

  it('blanc sur noir ≈ -107.88 (polarité inverse, signe négatif)', () => {
    expect(Math.abs(apcaLc('#ffffff', '#000000') - -107.88)).toBeLessThan(0.1);
  });

  it('#888888 sur blanc ≈ 63.06', () => {
    expect(Math.abs(apcaLc('#888888', '#ffffff') - 63.06)).toBeLessThan(0.2);
  });

  it('couleurs identiques ou très proches : 0', () => {
    expect(apcaLc('#777777', '#777777')).toBe(0);
    expect(apcaLc('#fefefe', '#ffffff')).toBe(0);
  });

  it('accepte oklch(…) et objets ; hors gamut : RangeError', () => {
    expect(apcaLc('oklch(0% 0 0)', { l: 1, c: 0, h: 0 })).toBeCloseTo(apcaLc('#000000', '#ffffff'));
    expect(() => apcaLc(OUT_OF_GAMUT, '#ffffff')).toThrow(RangeError);
  });
});
