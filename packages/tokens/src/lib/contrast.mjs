/**
 * Contraste : rapport WCAG 2 (normatif) et Lc APCA (informatif). ESM pur ; types : contrast.d.mts.
 * Calcul sur la couleur sRGB rendue (gamma), jamais sur le L d'OKLCH.
 */
import { gammaToLinear, inSrgbGamut, oklchToSrgb, parseOklch } from './color.mjs';

// WCAG 2.2 (W3C, 2023), définitions « relative luminance » et « contrast ratio ».
// Linéarisation par gammaToLinear (seuil 0.04045 de l'IEC 61966-2-1) ; le 0.03928 historique de
// WCAG ne change aucun canal 8 bits (note de WCAG 2.2).
const WCAG_RED = 0.2126;
const WCAG_GREEN = 0.7152;
const WCAG_BLUE = 0.0722;
const WCAG_FLARE = 0.05;

// APCA 0.0.98G-4g, Andrew Somers (Myndex), apca-w3 0.1.9 / SAPC-APCA, constantes « G-4g ».
// Informatif seulement : WCAG 3 n'a pas d'algorithme de contraste arrêté, jamais bloquant.
const APCA = Object.freeze({
  mainTrc: 2.4,
  red: 0.2126729,
  green: 0.7151522,
  blue: 0.072175,
  normBg: 0.56,
  normTxt: 0.57,
  revTxt: 0.62,
  revBg: 0.65,
  blkThrs: 0.022,
  blkClmp: 1.414,
  scaleBoW: 1.14,
  scaleWoB: 1.14,
  loBoWoffset: 0.027,
  loWoBoffset: 0.027,
  deltaYmin: 0.0005,
  loClip: 0.1,
});
const LC_SCALE = 100;

const BYTE_MAX = 255;
const HEX_RADIX = 16;
const HEX_PATTERN = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

// Bruit d'arrondi toléré par inSrgbGamut (±1e-4) : ramené dans [0, 1] après le contrôle.
const clampUnit = (value) => Math.min(1, Math.max(0, value));

function hexToSrgb(text) {
  const match = HEX_PATTERN.exec(text);
  if (!match) throw new TypeError(`contraste : « ${text} » attendu #rrggbb.`);
  const [r, g, b] = match.slice(1).map((pair) => Number.parseInt(pair, HEX_RADIX) / BYTE_MAX);
  return { r, g, b };
}

function oklchToRenderedSrgb(color) {
  if (!inSrgbGamut(color)) {
    const { l, c, h } = color;
    throw new RangeError(`contraste : oklch(${l} ${c} ${h}) hors gamut sRGB.`);
  }
  const { r, g, b } = oklchToSrgb(color);
  return { r: clampUnit(r), g: clampUnit(g), b: clampUnit(b) };
}

/** `oklch(…)`, `#rrggbb` ou `{ l, c, h }` → sRGB gamma dans [0, 1]. */
function toSrgb(color) {
  if (typeof color === 'object' && color !== null) return oklchToRenderedSrgb(color);
  const text = String(color).trim();
  if (text.startsWith('#')) return hexToSrgb(text);
  return oklchToRenderedSrgb(parseOklch(text));
}

export function relativeLuminance({ r, g, b }) {
  return WCAG_RED * gammaToLinear(r) + WCAG_GREEN * gammaToLinear(g) + WCAG_BLUE * gammaToLinear(b);
}

export function contrastRatio(a, b) {
  const [lighter, darker] = [a, b]
    .map((color) => relativeLuminance(toSrgb(color)))
    .sort((x, y) => y - x);
  return (lighter + WCAG_FLARE) / (darker + WCAG_FLARE);
}

/** Luminance APCA : puissance simple (pas la courbe sRGB), puis rehaussement des noirs. */
function apcaLuminance({ r, g, b }) {
  const { mainTrc, blkThrs, blkClmp } = APCA;
  const y = APCA.red * r ** mainTrc + APCA.green * g ** mainTrc + APCA.blue * b ** mainTrc;
  return y > blkThrs ? y : y + (blkThrs - y) ** blkClmp;
}

function normalPolarity(textY, backgroundY) {
  const sapc = (backgroundY ** APCA.normBg - textY ** APCA.normTxt) * APCA.scaleBoW;
  return sapc < APCA.loClip ? 0 : sapc - APCA.loBoWoffset;
}

function reversePolarity(textY, backgroundY) {
  const sapc = (backgroundY ** APCA.revBg - textY ** APCA.revTxt) * APCA.scaleWoB;
  return sapc > -APCA.loClip ? 0 : sapc + APCA.loWoBoffset;
}

/** Lc APCA signé : positif = texte sombre sur fond clair, négatif = texte clair sur fond sombre. */
export function apcaLc(text, background) {
  const textY = apcaLuminance(toSrgb(text));
  const backgroundY = apcaLuminance(toSrgb(background));
  if (Math.abs(backgroundY - textY) < APCA.deltaYmin) return 0;
  const polarity = backgroundY > textY ? normalPolarity : reversePolarity;
  return polarity(textY, backgroundY) * LC_SCALE;
}
