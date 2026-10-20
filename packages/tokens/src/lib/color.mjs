/**
 * Couleur : OKLCH ↔ sRGB, gamut, hexadécimal. ESM pur, sans dépendance ; types : color.d.mts.
 * Formules : CSS Color Module Level 4 (W3C), § 9 (Oklab, OkLCh) et § 10.2 (sRGB).
 * Matrices : Björn Ottosson, « A perceptual color space for image processing » (2020),
 * https://bottosson.github.io/posts/oklab/ (révision du 25 janvier 2021). Une ligne par sortie,
 * `x`, `y`, `z` = coefficients des entrées ; LMS_PRIME = LMS non linéaire (racine cubique).
 */

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

const OKLAB_TO_LMS_PRIME = [
  { x: 1, y: 0.3963377774, z: 0.2158037573 },
  { x: 1, y: -0.1055613458, z: -0.0638541728 },
  { x: 1, y: -0.0894841775, z: -1.291485548 },
];
const LMS_TO_LINEAR_SRGB = [
  { x: 4.0767416621, y: -3.3077115913, z: 0.2309699292 },
  { x: -1.2684380046, y: 2.6097574011, z: -0.3413193965 },
  { x: -0.0041960863, y: -0.7034186147, z: 1.707614701 },
];
const LINEAR_SRGB_TO_LMS = [
  { x: 0.4122214708, y: 0.5363325363, z: 0.0514459929 },
  { x: 0.2119034982, y: 0.6806995451, z: 0.1073969566 },
  { x: 0.0883024619, y: 0.2817188376, z: 0.6299787005 },
];
const LMS_PRIME_TO_OKLAB = [
  { x: 0.2104542553, y: 0.793617785, z: -0.0040720468 },
  { x: 1.9779984951, y: -2.428592205, z: 0.4505937099 },
  { x: 0.0259040371, y: 0.7827717662, z: -0.808675766 },
];

const NUMBER = String.raw`([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)`;
const OKLCH_BODY = [`${NUMBER}(%?)`, NUMBER, NUMBER].join(String.raw`\s+`);
const OKLCH_PATTERN = new RegExp(String.raw`^\s*oklch\(\s*${OKLCH_BODY}\s*\)\s*$`, 'i');
const HEX_PATTERN = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

const multiply = (matrix, [a, b, c]) => matrix.map(({ x, y, z }) => x * a + y * b + z * c);
const cube = (value) => value ** LMS_EXPONENT;
const trimNumber = (value) => String(Number(value.toFixed(MAX_DECIMALS)));
const pairToLinear = (pair) => gammaToLinear(Number.parseInt(pair, HEX_RADIX) / BYTE_MAX);
const toByte = (value) => Math.round(Math.min(1, Math.max(0, value)) * BYTE_MAX);
const toHexPair = (value) => toByte(value).toString(HEX_RADIX).padStart(HEX_PAIR_LENGTH, '0');

export function parseOklch(text) {
  const match = OKLCH_PATTERN.exec(String(text));
  if (!match) throw new TypeError(`parseOklch : « ${text} » attendu oklch(L C H).`);
  const [, lightness, percent, chroma, hue] = match;
  const l = Number(lightness) / (percent ? PERCENT : 1);
  const c = Number(chroma);
  if (l < 0 || l > 1 || c < 0) throw new TypeError(`parseOklch : « ${text} » hors bornes.`);
  return { l, c, h: Number(hue) };
}

export function formatOklch({ l, c, h }) {
  return `oklch(${trimNumber(l * PERCENT)}% ${trimNumber(c)} ${trimNumber(h)})`;
}

export function oklchToLinearSrgb({ l, c, h }) {
  const hue = (h * Math.PI) / HALF_TURN_DEGREES;
  const lmsPrime = multiply(OKLAB_TO_LMS_PRIME, [l, c * Math.cos(hue), c * Math.sin(hue)]);
  const [r, g, b] = multiply(LMS_TO_LINEAR_SRGB, lmsPrime.map(cube));
  return { r, g, b };
}

/** sRGB linéaire → gamma ; prolongée par symétrie hors de [0, 1] (CSS Color 4 § 10.2). */
export function linearToGamma(value) {
  const abs = Math.abs(value);
  if (abs <= SRGB_LINEAR_THRESHOLD) return value * SRGB_LINEAR_SLOPE;
  return Math.sign(value) * (SRGB_SCALE * abs ** (1 / SRGB_GAMMA) - SRGB_OFFSET);
}

export function gammaToLinear(value) {
  const abs = Math.abs(value);
  if (abs <= SRGB_GAMMA_THRESHOLD) return value / SRGB_LINEAR_SLOPE;
  return Math.sign(value) * ((abs + SRGB_OFFSET) / SRGB_SCALE) ** SRGB_GAMMA;
}

/** Sans rognage : hors gamut, les canaux sortent de [0, 1]. */
export function oklchToSrgb(color) {
  const { r, g, b } = oklchToLinearSrgb(color);
  return { r: linearToGamma(r), g: linearToGamma(g), b: linearToGamma(b) };
}

export function inSrgbGamut(color, epsilon = DEFAULT_GAMUT_EPSILON) {
  return Object.values(oklchToSrgb(color)).every((v) => v >= -epsilon && v <= 1 + epsilon);
}

/** La palette doit tenir dans sRGB (règle du design system) : RangeError, jamais de rognage. */
export function toHex(color) {
  if (!inSrgbGamut(color)) throw new RangeError(`toHex : ${formatOklch(color)} hors gamut sRGB.`);
  return `#${Object.values(oklchToSrgb(color)).map(toHexPair).join('')}`;
}

export function hexToOklch(hex) {
  const match = HEX_PATTERN.exec(String(hex));
  if (!match) throw new TypeError(`hexToOklch : « ${hex} » attendu #rrggbb.`);
  const lmsPrime = multiply(LINEAR_SRGB_TO_LMS, match.slice(1).map(pairToLinear)).map(Math.cbrt);
  const [l, a, b] = multiply(LMS_PRIME_TO_OKLAB, lmsPrime);
  const c = Math.hypot(a, b);
  if (c < ACHROMATIC_CHROMA) return { l, c: 0, h: 0 };
  const h = (Math.atan2(b, a) * HALF_TURN_DEGREES) / Math.PI;
  return { l, c, h: (h + FULL_TURN_DEGREES) % FULL_TURN_DEGREES };
}
