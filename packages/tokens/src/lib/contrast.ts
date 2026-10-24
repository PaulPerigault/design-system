/**
 * Contraste : rapport WCAG 2 (normatif) et Lc APCA (informatif). ESM pur.
 * Calcul sur la couleur sRGB rendue (gamma), jamais sur le L d'OKLCH.
 */
import type { Oklch, Rgb } from './color.ts';
import { gammaToLinear, inSrgbGamut, oklchToSrgb, parseOklch } from './color.ts';

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
/** `'oklch(L C H)'`, `'#rrggbb'` ou objet OKLCH ; hors gamut sRGB : `RangeError`. */
export type ContrastColor = string | Oklch;

const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));

function hexToSrgb(text: string): Rgb {
  const match = HEX_PATTERN.exec(text);
  if (!match) throw new TypeError(`contraste : « ${text} » attendu #rrggbb.`);
  const channel = (pair = ''): number => Number.parseInt(pair, HEX_RADIX) / BYTE_MAX;
  return { r: channel(match[1]), g: channel(match[2]), b: channel(match[3]) };
}

function oklchToRenderedSrgb(color: Oklch): Rgb {
  if (!inSrgbGamut(color)) {
    const { l, c, h } = color;
    throw new RangeError(`contraste : oklch(${l} ${c} ${h}) hors gamut sRGB.`);
  }
  const { r, g, b } = oklchToSrgb(color);
  return { r: clampUnit(r), g: clampUnit(g), b: clampUnit(b) };
}

/** `oklch(…)`, `#rrggbb` ou `{ l, c, h }` → sRGB gamma dans [0, 1]. */
function toSrgb(color: ContrastColor): Rgb {
  if (typeof color === 'object') return oklchToRenderedSrgb(color);
  const text = color.trim();
  if (text.startsWith('#')) return hexToSrgb(text);
  return oklchToRenderedSrgb(parseOklch(text));
}

/** Luminance relative WCAG 2.x, de canaux sRGB gamma dans [0, 1]. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return WCAG_RED * gammaToLinear(r) + WCAG_GREEN * gammaToLinear(g) + WCAG_BLUE * gammaToLinear(b);
}

/** Rapport de contraste WCAG 2, de 1 à 21, indépendant de l'ordre des couleurs. */
export function contrastRatio(a: ContrastColor, b: ContrastColor): number {
  const first = relativeLuminance(toSrgb(a));
  const second = relativeLuminance(toSrgb(b));
  return (Math.max(first, second) + WCAG_FLARE) / (Math.min(first, second) + WCAG_FLARE);
}

/** Luminance APCA : puissance simple (pas la courbe sRGB), puis rehaussement des noirs. */
function apcaLuminance({ r, g, b }: Rgb): number {
  const { mainTrc, blkThrs, blkClmp } = APCA;
  const y = APCA.red * r ** mainTrc + APCA.green * g ** mainTrc + APCA.blue * b ** mainTrc;
  return y > blkThrs ? y : y + (blkThrs - y) ** blkClmp;
}

function normalPolarity(textY: number, backgroundY: number): number {
  const sapc = (backgroundY ** APCA.normBg - textY ** APCA.normTxt) * APCA.scaleBoW;
  return sapc < APCA.loClip ? 0 : sapc - APCA.loBoWoffset;
}

function reversePolarity(textY: number, backgroundY: number): number {
  const sapc = (backgroundY ** APCA.revBg - textY ** APCA.revTxt) * APCA.scaleWoB;
  return sapc > -APCA.loClip ? 0 : sapc + APCA.loWoBoffset;
}

/** Lc APCA signé : positif = texte sombre sur fond clair, négatif = texte clair sur fond sombre. */
export function apcaLc(text: ContrastColor, background: ContrastColor): number {
  const textY = apcaLuminance(toSrgb(text));
  const backgroundY = apcaLuminance(toSrgb(background));
  if (Math.abs(backgroundY - textY) < APCA.deltaYmin) return 0;
  const polarity = backgroundY > textY ? normalPolarity : reversePolarity;
  return polarity(textY, backgroundY) * LC_SCALE;
}
