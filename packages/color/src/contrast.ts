/**
 * Contraste WCAG 2 et APCA, mêmes noms et signatures que `@paulperigault/tokens`
 * (`lib/contrast.ts`). Une couleur est `#rrggbb` ou un objet OKLCH : le texte `oklch(…)` n'est pas
 * accepté (son analyse reste dans `tokens`).
 */
import { fromRgb } from './channels.ts';
import { run } from './runtime.ts';
import type { RawColor } from './raw.ts';
import type { ContrastColor, Rgb } from './types.ts';

function channels(raw: RawColor, color: ContrastColor): Float64Array {
  if (typeof color === 'object') return raw.renderedSrgb(color.l, color.c, color.h);
  return raw.parseHex(color.trim());
}

/** Luminance relative WCAG 2.x. Un canal hors de [0, 1] : `ColorError` `out-of-range`. */
export const relativeLuminance = (color: Rgb): number =>
  run((raw) => raw.relativeLuminance(fromRgb(color)));

/** Rapport de contraste WCAG 2, de 1 à 21, indépendant de l'ordre des couleurs. */
export const contrastRatio = (a: ContrastColor, b: ContrastColor): number =>
  run((raw) => raw.contrastRatio(channels(raw, a), channels(raw, b)));

/** Lc APCA signé : positif = texte sombre sur fond clair, négatif = texte clair sur fond sombre. */
export const apcaLc = (text: ContrastColor, background: ContrastColor): number =>
  run((raw) => raw.apcaLc(channels(raw, text), channels(raw, background)));
