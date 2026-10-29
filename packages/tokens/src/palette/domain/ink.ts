import type { Oklch } from '../../lib/color.ts';
import { contrastRatio } from '../../lib/contrast.ts';
import { MIN_TEXT_CONTRAST } from './thresholds.ts';

/** Neutre de texte d'un thème : `fg` (texte) ou `bg` (fond de page). */
export type Ink = 'fg' | 'bg';

export interface Inks {
  readonly fg: Oklch;
  readonly bg: Oklch;
}

/**
 * Neutre le plus contrasté pour écrire sur `background`, ou `null` si aucun n'atteint `min`
 * (WCAG 2.2, 1.4.3) : le texte n'a alors pas sa place sur cette couleur.
 */
export function inkOn(background: Oklch, inks: Inks, min = MIN_TEXT_CONTRAST): Ink | null {
  const onFg = contrastRatio(inks.fg, background);
  const onBg = contrastRatio(inks.bg, background);
  if (Math.max(onFg, onBg) < min) return null;
  return onFg >= onBg ? 'fg' : 'bg';
}
