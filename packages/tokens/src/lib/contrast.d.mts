import type { Oklch, Rgb } from './color.mjs';

/** `'oklch(L C H)'`, `'#rrggbb'` ou objet OKLCH ; hors gamut sRGB : `RangeError`, sans rognage. */
export type ContrastColor = string | Oklch;

/** Luminance relative WCAG 2.x, de canaux sRGB gamma dans [0, 1] ; résultat dans [0, 1]. */
export function relativeLuminance(color: Rgb): number;

/** Rapport de contraste WCAG 2, de 1 à 21, indépendant de l'ordre des couleurs. */
export function contrastRatio(a: ContrastColor, b: ContrastColor): number;

/**
 * Lc APCA 0.0.98G-4g (Myndex), signé : positif = texte sombre sur fond clair.
 * Informatif seulement, jamais bloquant (WCAG 3 sans algorithme de contraste arrêté).
 */
export function apcaLc(text: ContrastColor, background: ContrastColor): number;
