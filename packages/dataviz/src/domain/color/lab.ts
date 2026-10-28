import type { Rgb } from '@paulperigault/tokens/color';

/** CIE L*a*b* (illuminant D65) depuis du sRGB linéaire (IEC 61966-2-1, CIE 15). */
export interface Lab {
  readonly l: number;
  readonly a: number;
  readonly b: number;
}

interface Row {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly white: number;
}

const SRGB_TO_XYZ_D65: readonly [Row, Row, Row] = [
  { r: 0.4124564, g: 0.3575761, b: 0.1804375, white: 0.95047 },
  { r: 0.2126729, g: 0.7151522, b: 0.072175, white: 1 },
  { r: 0.0193339, g: 0.119192, b: 0.9503041, white: 1.08883 },
];

const LAB = {
  epsilon: 0.008856,
  kappa: 903.3,
  scale: 116,
  offset: 16,
  aScale: 500,
  bScale: 200,
};

const f = (t: number): number =>
  t > LAB.epsilon ? Math.cbrt(t) : (LAB.kappa * t + LAB.offset) / LAB.scale;

const channel = (row: Row, { r, g, b }: Rgb): number =>
  f((row.r * r + row.g * g + row.b * b) / row.white);

export function linearSrgbToLab(color: Rgb): Lab {
  const [fx, fy, fz] = SRGB_TO_XYZ_D65.map((row) => channel(row, color));
  if (fx === undefined || fy === undefined || fz === undefined) return { l: 0, a: 0, b: 0 };
  return { l: LAB.scale * fy - LAB.offset, a: LAB.aScale * (fx - fy), b: LAB.bScale * (fy - fz) };
}
