// APCA-W3 0.1.9 (Andrew Somers, Myndex) : Lc, contraste perceptuel signé. Informatif : APCA
// n'est pas normatif en WCAG 2.2 (seul le ratio WCAG 2 fait foi).
// Constantes « 0.0.98G-4g » (objet SA98G de apca-w3, src/apca-w3.js, version 0.1.9) :
// https://github.com/Myndex/apca-w3. Entrée : sRGB 8 bits, exposant simple (pas la courbe sRGB).
const SA98G = Object.freeze({
  mainTRC: 2.4,
  sRco: 0.2126729,
  sGco: 0.7151522,
  sBco: 0.072175,
  normBG: 0.56,
  normTXT: 0.57,
  revTXT: 0.62,
  revBG: 0.65,
  blkThrs: 0.022,
  blkClmp: 1.414,
  scaleBoW: 1.14,
  scaleWoB: 1.14,
  loBoWoffset: 0.027,
  loWoBoffset: 0.027,
  deltaYmin: 0.0005,
  loClip: 0.1,
});
// Plage d'entrée acceptée par APCAcontrast (`icp` de apca-w3) ; hors plage : Lc 0.
const INPUT_RANGE = Object.freeze({ min: 0, max: 1.1 });
const LC_SCALE = 100;
const BYTE_MAX = 255;
const HEX_RADIX = 16;
const HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

export const APCA_VERSION = 'APCA-W3 0.1.9';

/** Canaux 8 bits (0 à 255) d'une couleur sRGB. */
export type Rgb = readonly [number, number, number];

/** Luminance estimée Y d'une couleur sRGB 8 bits (`sRGBtoY` de apca-w3). */
export function srgbToY([r, g, b]: Rgb): number {
  const channel = (value: number): number => (value / BYTE_MAX) ** SA98G.mainTRC;
  return SA98G.sRco * channel(r) + SA98G.sGco * channel(g) + SA98G.sBco * channel(b);
}

const inRange = (y: number): boolean =>
  Number.isFinite(y) && y >= INPUT_RANGE.min && y <= INPUT_RANGE.max;

/** Rehaussement doux des noirs (« soft clamp ») sous le seuil `blkThrs`. */
const softClamp = (y: number): number =>
  y > SA98G.blkThrs ? y : y + (SA98G.blkThrs - y) ** SA98G.blkClmp;

function normalPolarity(textY: number, backgroundY: number): number {
  const sapc = (backgroundY ** SA98G.normBG - textY ** SA98G.normTXT) * SA98G.scaleBoW;
  return sapc < SA98G.loClip ? 0 : sapc - SA98G.loBoWoffset;
}

function reversePolarity(textY: number, backgroundY: number): number {
  const sapc = (backgroundY ** SA98G.revBG - textY ** SA98G.revTXT) * SA98G.scaleWoB;
  return sapc > -SA98G.loClip ? 0 : sapc + SA98G.loWoBoffset;
}

/**
 * Lc signé (`APCAcontrast` de apca-w3) : positif = texte sombre sur fond clair. `textY` et
 * `backgroundY` : luminances du texte et du fond.
 */
export function apcaContrast(textY: number, backgroundY: number): number {
  if (!inRange(textY) || !inRange(backgroundY)) return 0;
  const text = softClamp(textY);
  const background = softClamp(backgroundY);
  if (Math.abs(background - text) < SA98G.deltaYmin) return 0;
  const polarity = background > text ? normalPolarity : reversePolarity;
  return polarity(text, background) * LC_SCALE;
}

/** `#rrggbb` → canaux 8 bits ; lève une `TypeError` sinon. */
export function hexToRgb(hex: string): Rgb {
  const [, red, green, blue] = HEX.exec(hex) ?? [];
  if (red === undefined || green === undefined || blue === undefined) {
    throw new TypeError(`APCA : « ${hex} » attendu #rrggbb.`);
  }
  const byte = (pair: string): number => Number.parseInt(pair, HEX_RADIX);
  return [byte(red), byte(green), byte(blue)];
}

/** Lc APCA de deux couleurs `#rrggbb` (texte, fond). */
export const apcaLc = (textHex: string, backgroundHex: string): number =>
  apcaContrast(srgbToY(hexToRgb(textHex)), srgbToY(hexToRgb(backgroundHex)));
