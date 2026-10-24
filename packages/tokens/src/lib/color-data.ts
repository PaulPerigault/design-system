/**
 * Types et matrices de couleur.
 * Matrices : Björn Ottosson, « A perceptual color space for image processing » (2020),
 * https://bottosson.github.io/posts/oklab/ (révision du 25 janvier 2021). Une ligne par sortie,
 * `x`, `y`, `z` = coefficients des entrées ; LMS_PRIME = LMS non linéaire (racine cubique).
 */

/** Couleur OKLCH : `l` dans [0, 1], `c` ≥ 0, `h` en degrés. */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

/** Canaux sRGB, linéaires ou gamma selon la fonction ; [0, 1] dans le gamut. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export type Vec3 = readonly [number, number, number];
export interface Row {
  x: number;
  y: number;
  z: number;
}
export type Matrix = readonly [Row, Row, Row];

export const OKLAB_TO_LMS_PRIME: Matrix = [
  { x: 1, y: 0.3963377774, z: 0.2158037573 },
  { x: 1, y: -0.1055613458, z: -0.0638541728 },
  { x: 1, y: -0.0894841775, z: -1.291485548 },
];
export const LMS_TO_LINEAR_SRGB: Matrix = [
  { x: 4.0767416621, y: -3.3077115913, z: 0.2309699292 },
  { x: -1.2684380046, y: 2.6097574011, z: -0.3413193965 },
  { x: -0.0041960863, y: -0.7034186147, z: 1.707614701 },
];
export const LINEAR_SRGB_TO_LMS: Matrix = [
  { x: 0.4122214708, y: 0.5363325363, z: 0.0514459929 },
  { x: 0.2119034982, y: 0.6806995451, z: 0.1073969566 },
  { x: 0.0883024619, y: 0.2817188376, z: 0.6299787005 },
];
export const LMS_PRIME_TO_OKLAB: Matrix = [
  { x: 0.2104542553, y: 0.793617785, z: -0.0040720468 },
  { x: 1.9779984951, y: -2.428592205, z: 0.4505937099 },
  { x: 0.0259040371, y: 0.7827717662, z: -0.808675766 },
];

const dot = ({ x, y, z }: Row, [a, b, c]: Vec3): number => x * a + y * b + z * c;
export const multiply = (m: Matrix, v: Vec3): Vec3 => [dot(m[0], v), dot(m[1], v), dot(m[2], v)];
