import { describe, expect, it } from 'vitest';
import { parseColor } from '../src/color.ts';
import { MilestonesError } from '../src/error.ts';

const CLOSE = 1e-6;
const near = (value: number | undefined, expected: number, digits = 5): void =>
  expect(value ?? Number.NaN).toBeCloseTo(expected, digits);

describe('formes prises en charge', () => {
  it('oklch : nombres, pourcentages, unités d’angle, none, opacité', () => {
    expect(parseColor('oklch(0.5 0.1 120)')).toEqual({ space: 'oklch', l: 0.5, c: 0.1, h: 120 });
    expect(parseColor('oklch(50% 25% 120deg)')).toEqual({ space: 'oklch', l: 0.5, c: 0.1, h: 120 });
    expect(parseColor('oklch(0.5 0.1 0.5turn)')).toMatchObject({ h: 180 });
    expect(parseColor('oklch(0.5 0.1 200grad)')).toMatchObject({ h: 180 });
    expect(parseColor('oklch(0.5 0.1 none)')).toMatchObject({ h: 0 });
    expect(parseColor('oklch(0.5 0.1 270 / 0.5)')).toMatchObject({ l: 0.5, h: 270 });
    expect(parseColor('OKLCH( 0.5  0.1  270 )')).toMatchObject({ h: 270 });
  });

  it('rgb et rgba : virgules ou espaces, pourcentages, opacité ignorée', () => {
    const expected = { space: 'srgb', r: 10 / 255, g: 20 / 255, b: 30 / 255 };
    expect(parseColor('rgb(10, 20, 30)')).toEqual(expected);
    expect(parseColor('rgb(10 20 30)')).toEqual(expected);
    expect(parseColor('rgba(10, 20, 30, 0.5)')).toEqual(expected);
    expect(parseColor('rgb(10 20 30 / 50%)')).toEqual(expected);
    expect(parseColor('rgb(100% 0% 50%)')).toEqual({ space: 'srgb', r: 1, g: 0, b: 0.5 });
  });

  it('color(srgb) tel quel, color(srgb-linear) recodé en gamma', () => {
    expect(parseColor('color(srgb 0.2 0.4 0.6)')).toEqual({
      space: 'srgb',
      r: 0.2,
      g: 0.4,
      b: 0.6,
    });
    const linear = parseColor('color(srgb-linear 0.5 0 1)');
    expect(linear.space).toBe('srgb');
    if (linear.space === 'srgb') {
      near(linear.r, 0.735357);
      near(linear.g, 0);
      near(linear.b, 1);
    }
  });

  it('oklab devient OKLCH (chroma et teinte de l’axe a, b)', () => {
    const color = parseColor('oklab(0.5 0.1 -0.1)');
    expect(color).toMatchObject({ space: 'oklch', l: 0.5 });
    if (color.space === 'oklch') {
      expect(Math.abs(color.c - Math.SQRT2 * 0.1)).toBeLessThan(CLOSE);
      near(color.h, 315);
    }
  });
});

describe('formes refusées', () => {
  const unsupported = [
    'lab(50 20 30)',
    'lch(50 30 270)',
    'color(display-p3 0.2 0.4 0.6)',
    'color(rec2020 0.2 0.4 0.6)',
    'color-mix(in srgb, red 50%, blue)',
    'hsl(210 50% 40%)',
    '#336699',
    'rebeccapurple',
    'currentcolor',
    'rgb(10 20)',
    'rgb(10 20 30 40 50)',
    'rgb(a b c)',
    'oklch(0.5 0.1)',
    'oklch(0.5 0.1 50%)',
    'oklch(abc 0.1 270)',
    'constructor(1 2 3)',
    '',
  ];
  for (const text of unsupported) {
    it(`« ${text} » lève unsupported-color`, () => {
      expect(() => parseColor(text)).toThrow(MilestonesError);
      expect(() => parseColor(text)).toThrow(/unsupported-color/);
    });
  }
});
