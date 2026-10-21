/**
 * Contraste d'un texte posé sur un voile semi-opaque, quelle que soit l'image dessous.
 * Composition en sRGB gamma, comme `color-mix(in srgb)` et la composition des navigateurs.
 */
import type { Rgb } from '@paulperigault/tokens/color';
import { relativeLuminance } from '@paulperigault/tokens/contrast';

export interface Veil {
  /** Couleur du voile (sRGB gamma, canaux dans [0, 1]). */
  veil: Rgb;
  /** Opacité du voile dans [0, 1]. */
  opacity: number;
  /** Couleur du texte (sRGB gamma). */
  text: Rgb;
}

/** Décalage de la formule de contraste WCAG 2 (lumière ambiante). */
const FLARE = 0.05;
const BLACK: Rgb = { r: 0, g: 0, b: 0 };
const WHITE: Rgb = { r: 1, g: 1, b: 1 };

const mix = (top: number, opacity: number, under: number): number =>
  opacity * top + (1 - opacity) * under;

/** Couleur obtenue en posant `veil` à `opacity` sur `under`. */
export function compositeOver(veil: Rgb, opacity: number, under: Rgb): Rgb {
  if (!(opacity >= 0 && opacity <= 1)) throw new RangeError(`Opacité hors de [0, 1] : ${opacity}`);
  return {
    r: mix(veil.r, opacity, under.r),
    g: mix(veil.g, opacity, under.g),
    b: mix(veil.b, opacity, under.b),
  };
}

const ratio = (a: number, b: number): number => (Math.max(a, b) + FLARE) / (Math.min(a, b) + FLARE);

/**
 * Pire contraste WCAG 2 sur toute image possible. La luminance du composite croît avec chaque
 * canal du fond : elle reste entre celle du composite sur noir et celle sur blanc. Si la
 * luminance du texte tombe dans cet intervalle, un fond rend le texte invisible (1:1).
 */
export function worstCaseContrast({ veil, opacity, text }: Veil): number {
  const darkest = relativeLuminance(compositeOver(veil, opacity, BLACK));
  const lightest = relativeLuminance(compositeOver(veil, opacity, WHITE));
  const own = relativeLuminance(text);
  if (own >= darkest && own <= lightest) return 1;
  return Math.min(ratio(own, darkest), ratio(own, lightest));
}
