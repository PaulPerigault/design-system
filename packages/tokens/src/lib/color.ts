/**
 * Couleur : OKLCH ↔ sRGB, gamut, hexadécimal. ESM pur, sans dépendance.
 * Formules : CSS Color Module Level 4 (W3C), § 9 (Oklab, OkLCh) et § 10.2 (sRGB).
 * Matrices et types : color-data.ts.
 */
import type { Oklch, Rgb } from './color-data.ts';
import * as data from './color-data.ts';

export type { Oklch, Rgb } from './color-data.ts';
const PERCENT = 100;
const MAX_DECIMALS = 4;
const HALF_TURN_DEGREES = 180;
const FULL_TURN_DEGREES = 360;
const LMS_EXPONENT = 3;
const ACHROMATIC_CHROMA = 1e-6; // en deçà, gris : bruit d'arrondi des matrices (~4e-8)
const DEFAULT_GAMUT_EPSILON = 1e-4;
const BYTE_MAX = 255;
const HEX_RADIX = 16;
const HEX_PAIR_LENGTH = 2;

// Fonction de transfert sRGB : IEC 61966-2-1:1999, reprise par CSS Color 4 § 10.2.
const SRGB_LINEAR_THRESHOLD = 0.0031308;
const SRGB_GAMMA_THRESHOLD = 0.04045;
const SRGB_LINEAR_SLOPE = 12.92;
const SRGB_GAMMA = 2.4;
const SRGB_OFFSET = 0.055;
const SRGB_SCALE = 1 + SRGB_OFFSET;

const NUMBER = String.raw`([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)`;
const OKLCH_BODY = [`${NUMBER}(%?)`, NUMBER, NUMBER].join(String.raw`\s+`);
const OKLCH_PATTERN = new RegExp(String.raw`^\s*oklch\(\s*${OKLCH_BODY}\s*\)\s*$`, 'i');
const HEX_PATTERN = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

const cube = (value: number): number => value ** LMS_EXPONENT;
const trimNumber = (value: number): string => String(Number(value.toFixed(MAX_DECIMALS)));
const pairToLinear = (pair: string): number =>
  gammaToLinear(Number.parseInt(pair, HEX_RADIX) / BYTE_MAX);
const toByte = (value: number): number => Math.round(Math.min(1, Math.max(0, value)) * BYTE_MAX);
const toHexPair = (value: number): string =>
  toByte(value).toString(HEX_RADIX).padStart(HEX_PAIR_LENGTH, '0');

/** `'oklch(0.47 0.19 270.7)'` ou `'oklch(47% 0.19 270.7)'` ; lève une `TypeError` sinon. */
export function parseOklch(text: string): Oklch {
  const match = OKLCH_PATTERN.exec(String(text));
  if (!match) throw new TypeError(`parseOklch : « ${text} » attendu oklch(L C H).`);
  const [, lightness, percent, chroma, hue] = match;
  const l = Number(lightness) / (percent ? PERCENT : 1);
  const c = Number(chroma);
  if (l < 0 || l > 1 || c < 0) throw new TypeError(`parseOklch : « ${text} » hors bornes.`);
  return { l, c, h: Number(hue) };
}

/** `'oklch(47% 0.19 270.7)'` : 4 décimales au plus, sans zéros inutiles. */
export function formatOklch({ l, c, h }: Oklch): string {
  return `oklch(${trimNumber(l * PERCENT)}% ${trimNumber(c)} ${trimNumber(h)})`;
}

/** OKLCH → Oklab → LMS → sRGB linéaire (CSS Color 4, matrices d'Ottosson). */
export function oklchToLinearSrgb({ l, c, h }: Oklch): Rgb {
  const hue = (h * Math.PI) / HALF_TURN_DEGREES;
  const lmsPrime = data.multiply(data.OKLAB_TO_LMS_PRIME, [
    l,
    c * Math.cos(hue),
    c * Math.sin(hue),
  ]);
  const [p, q, s] = lmsPrime;
  const [r, g, b] = data.multiply(data.LMS_TO_LINEAR_SRGB, [cube(p), cube(q), cube(s)]);
  return { r, g, b };
}

/** sRGB linéaire → gamma ; prolongée par symétrie hors de [0, 1] (CSS Color 4 § 10.2). */
export function linearToGamma(value: number): number {
  const abs = Math.abs(value);
  if (abs <= SRGB_LINEAR_THRESHOLD) return value * SRGB_LINEAR_SLOPE;
  return Math.sign(value) * (SRGB_SCALE * abs ** (1 / SRGB_GAMMA) - SRGB_OFFSET);
}

export function gammaToLinear(value: number): number {
  const abs = Math.abs(value);
  if (abs <= SRGB_GAMMA_THRESHOLD) return value / SRGB_LINEAR_SLOPE;
  return Math.sign(value) * ((abs + SRGB_OFFSET) / SRGB_SCALE) ** SRGB_GAMMA;
}

/** Sans rognage : hors gamut, les canaux sortent de [0, 1]. */
export function oklchToSrgb(color: Oklch): Rgb {
  const { r, g, b } = oklchToLinearSrgb(color);
  return { r: linearToGamma(r), g: linearToGamma(g), b: linearToGamma(b) };
}

/** Vrai si chaque canal gamma est dans [-epsilon, 1 + epsilon]. */
export function inSrgbGamut(color: Oklch, epsilon = DEFAULT_GAMUT_EPSILON): boolean {
  return Object.values(oklchToSrgb(color)).every((v) => v >= -epsilon && v <= 1 + epsilon);
}

/** La palette doit tenir dans sRGB (règle du design system) : RangeError, jamais de rognage. */
export function toHex(color: Oklch): string {
  if (!inSrgbGamut(color)) throw new RangeError(`toHex : ${formatOklch(color)} hors gamut sRGB.`);
  return `#${Object.values(oklchToSrgb(color)).map(toHexPair).join('')}`;
}

/** `'#rrggbb'` → OKLCH, `h` dans [0, 360), 0 pour un gris ; lève une `TypeError` sinon. */
export function hexToOklch(hex: string): Oklch {
  const match = HEX_PATTERN.exec(String(hex));
  if (!match) throw new TypeError(`hexToOklch : « ${hex} » attendu #rrggbb.`);
  const [, rr = '', gg = '', bb = ''] = match;
  const [x, y, z] = data.multiply(data.LINEAR_SRGB_TO_LMS, [
    pairToLinear(rr),
    pairToLinear(gg),
    pairToLinear(bb),
  ]);
  const [l, a, b] = data.multiply(data.LMS_PRIME_TO_OKLAB, [
    Math.cbrt(x),
    Math.cbrt(y),
    Math.cbrt(z),
  ]);
  const c = Math.hypot(a, b);
  if (c < ACHROMATIC_CHROMA) return { l, c: 0, h: 0 };
  const h = (Math.atan2(b, a) * HALF_TURN_DEGREES) / Math.PI;
  return { l, c, h: (h + FULL_TURN_DEGREES) % FULL_TURN_DEGREES };
}
