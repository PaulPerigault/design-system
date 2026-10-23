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

/**
 * Luminance estimée Y d'une couleur sRGB 8 bits (`sRGBtoY` de apca-w3).
 * @param {[number, number, number]} rgb canaux de 0 à 255
 */
export function srgbToY([r, g, b]) {
  const channel = (value) => (value / BYTE_MAX) ** SA98G.mainTRC;
  return SA98G.sRco * channel(r) + SA98G.sGco * channel(g) + SA98G.sBco * channel(b);
}

const inRange = (y) => Number.isFinite(y) && y >= INPUT_RANGE.min && y <= INPUT_RANGE.max;

/** Rehaussement doux des noirs (« soft clamp ») sous le seuil `blkThrs`. */
const softClamp = (y) => (y > SA98G.blkThrs ? y : y + (SA98G.blkThrs - y) ** SA98G.blkClmp);

function normalPolarity(textY, backgroundY) {
  const sapc = (backgroundY ** SA98G.normBG - textY ** SA98G.normTXT) * SA98G.scaleBoW;
  return sapc < SA98G.loClip ? 0 : sapc - SA98G.loBoWoffset;
}

function reversePolarity(textY, backgroundY) {
  const sapc = (backgroundY ** SA98G.revBG - textY ** SA98G.revTXT) * SA98G.scaleWoB;
  return sapc > -SA98G.loClip ? 0 : sapc + SA98G.loWoBoffset;
}

/**
 * Lc signé (`APCAcontrast` de apca-w3) : positif = texte sombre sur fond clair.
 * @param {number} textY luminance du texte
 * @param {number} backgroundY luminance du fond
 */
export function apcaContrast(textY, backgroundY) {
  if (!inRange(textY) || !inRange(backgroundY)) return 0;
  const text = softClamp(textY);
  const background = softClamp(backgroundY);
  if (Math.abs(background - text) < SA98G.deltaYmin) return 0;
  const polarity = background > text ? normalPolarity : reversePolarity;
  return polarity(text, background) * LC_SCALE;
}

/** `#rrggbb` → canaux 8 bits ; lève une `TypeError` sinon. */
export function hexToRgb(hex) {
  const match = HEX.exec(hex);
  if (!match) throw new TypeError(`APCA : « ${hex} » attendu #rrggbb.`);
  return match.slice(1).map((pair) => Number.parseInt(pair, HEX_RADIX));
}

/** Lc APCA de deux couleurs `#rrggbb` (texte, fond). */
export const apcaLc = (textHex, backgroundHex) =>
  apcaContrast(srgbToY(hexToRgb(textHex)), srgbToY(hexToRgb(backgroundHex)));
