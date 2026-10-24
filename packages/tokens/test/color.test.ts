import { describe, expect, it } from 'vitest';
import type { Oklch } from '../src/lib/color.ts';
import {
  formatOklch,
  gammaToLinear,
  hexToOklch,
  inSrgbGamut,
  linearToGamma,
  oklchToLinearSrgb,
  oklchToSrgb,
  parseOklch,
  toHex,
} from '../src/lib/color.ts';

const TOLERANCE_DIGITS = 3; // toBeCloseTo(x, 3) : écart < 5e-4, plus strict que 1e-3

const hueDistance = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180); // écart angulaire, en °
const expectOklch = (actual: Oklch, expected: Oklch) => {
  expect(actual.l).toBeCloseTo(expected.l, TOLERANCE_DIGITS);
  expect(actual.c).toBeCloseTo(expected.c, TOLERANCE_DIGITS);
  if (expected.c > 0) expect(hueDistance(actual.h, expected.h)).toBeLessThan(0.5);
};

// CSS Color 4, exemples d'Oklab (sRGB primaires).
const PRIMARIES: [string, Oklch][] = [
  ['#ff0000', { l: 0.62796, c: 0.25768, h: 29.2339 }],
  ['#00ff00', { l: 0.86644, c: 0.29483, h: 142.4953 }],
  ['#0000ff', { l: 0.45201, c: 0.31321, h: 264.052 }],
];

describe('hexToOklch', () => {
  it('blanc et noir sont achromatiques, teinte 0', () => {
    expect(hexToOklch('#ffffff')).toEqual({ l: expect.closeTo(1, 6), c: 0, h: 0 });
    expect(hexToOklch('#000000')).toEqual({ l: 0, c: 0, h: 0 });
  });

  it.each(PRIMARIES)('%s correspond aux vecteurs de CSS Color 4', (hex, expected) => {
    expectOklch(hexToOklch(hex), expected);
  });

  it('teinte dans [0, 360)', () => {
    const hues = ['#ff00ff', '#ff0080', '#808080'].map((hex) => hexToOklch(hex).h);
    expect(hues.every((h) => h >= 0 && h < 360)).toBe(true);
  });

  it('refuse ce qui n’est pas #rrggbb', () => {
    expect(() => hexToOklch('#fff')).toThrow(TypeError);
    expect(() => hexToOklch('ff0000')).toThrow(TypeError);
  });
});

describe('toHex', () => {
  it('blanc et noir', () => {
    expect(toHex({ l: 1, c: 0, h: 0 })).toBe('#ffffff');
    expect(toHex({ l: 0, c: 0, h: 0 })).toBe('#000000');
  });

  it.each(['#14161c', '#3749c3', '#9fb4f8', '#f9fafd', '#ff0000', '#00ff00', '#0000ff'])(
    'aller-retour exact sur %s',
    (hex) => expect(toHex(hexToOklch(hex))).toBe(hex),
  );

  it('lève une RangeError hors gamut, sans rogner', () => {
    const outside = parseOklch('oklch(0.7 0.4 140)');
    expect(inSrgbGamut(outside)).toBe(false);
    expect(() => toHex(outside)).toThrow(RangeError);
  });
});

describe('oklchToSrgb et gamut', () => {
  it('ne rogne pas : un canal hors gamut sort de [0, 1]', () => {
    const { r, g, b } = oklchToSrgb({ l: 0.7, c: 0.4, h: 140 });
    expect(Math.min(r, g, b) < 0 || Math.max(r, g, b) > 1).toBe(true);
  });

  it('gris : canaux linéaires égaux', () => {
    const { r, g, b } = oklchToLinearSrgb({ l: 0.5, c: 0, h: 0 });
    expect(g).toBeCloseTo(r, 9);
    expect(b).toBeCloseTo(r, 9);
  });

  it('epsilon réglable', () => {
    const white = { l: 1.00005, c: 0, h: 0 };
    expect(inSrgbGamut(white)).toBe(true);
    expect(inSrgbGamut(white, 0)).toBe(false);
  });
});

describe('fonction de transfert sRGB', () => {
  it('segments linéaire et puissance, de part et d’autre des seuils', () => {
    expect(linearToGamma(0.0031308)).toBeCloseTo(0.04045, 5);
    expect(gammaToLinear(0.04045)).toBeCloseTo(0.0031308, 6);
    expect(gammaToLinear(0.5)).toBeCloseTo(0.214041, 6);
  });

  it.each([0, 0.001, 0.2, 0.5, 1, -0.3])('aller-retour sur %s', (value) => {
    expect(gammaToLinear(linearToGamma(value))).toBeCloseTo(value, 12);
  });
});

describe('parseOklch et formatOklch', () => {
  it('formes nombre et pourcentage, espaces multiples', () => {
    expect(parseOklch('oklch(0.47 0.19 270.7)')).toEqual({ l: 0.47, c: 0.19, h: 270.7 });
    expect(parseOklch('oklch(47% 0.19 270.7)')).toEqual({ l: 0.47, c: 0.19, h: 270.7 });
    expect(parseOklch('  oklch(  47%   0.19\t270.7 )  ')).toEqual({ l: 0.47, c: 0.19, h: 270.7 });
  });

  it.each(['rgb(0 0 0)', 'oklch(0.5 0.1)', 'oklch(150% 0.1 20)', 'oklch(0.5 -0.1 20)', ''])(
    'refuse « %s » par une TypeError',
    (text) => expect(() => parseOklch(text)).toThrow(TypeError),
  );

  it('l en %, 4 décimales au plus, sans zéros inutiles', () => {
    expect(formatOklch({ l: 0.47, c: 0.19, h: 270.7 })).toBe('oklch(47% 0.19 270.7)');
    expect(formatOklch({ l: 0.627955, c: 0.2576833, h: 29.23388 })).toBe(
      'oklch(62.7955% 0.2577 29.2339)',
    );
    expect(formatOklch(parseOklch(formatOklch({ l: 1, c: 0, h: 0 })))).toBe('oklch(100% 0 0)');
  });
});
