/**
 * Boîte d'un badge posé sur sa médaille (pur, sans DOM). Le badge est une image HTML de face : sa
 * seule transformation est une translation et une mise à l'échelle uniforme (ADR-0014), jamais une
 * rotation, un biais ni une perspective. Le rapport largeur/hauteur naturel est donc conservé.
 */
import type { Size } from './milestones-3d-place';
import type { Mark } from './milestones-3d-types';

/** Part du diamètre du support que couvre le plus grand côté du badge ; le reste est le rebord. */
export const BADGE_SPAN = 0.84;
const DIAMETER = 2;
const HALF = 2;
/** Précision de l'ordre de superposition : plus grande est la médaille, plus elle est proche. */
const DEPTH_STEPS = 1000;

export interface BadgeBox {
  /** Coin haut gauche de l'image à sa taille naturelle, avant la mise à l'échelle. */
  left: number;
  top: number;
  /** Facteur uniforme appliqué à l'image (origine : son coin haut gauche). */
  factor: number;
  /** Rang de superposition (`z-index`) : les médailles proches recouvrent les lointaines. */
  depth: number;
  visible: boolean;
}

export const HIDDEN: BadgeBox = { left: 0, top: 0, factor: 1, depth: 0, visible: false };

/** Taille naturelle de l'image : une image pas encore décodée (côté nul) reste masquée. */
export const known = (size: Size): boolean => size.width > 0 && size.height > 0;

/** Boîte du badge de `mark` dans la scène de taille `area`, l'image mesurant `natural` pixels. */
export function badgeBox(mark: Mark, natural: Size, area: Size): BadgeBox {
  if (!mark.visible || !known(natural) || area.height <= 0) return HIDDEN;
  const longest = Math.max(natural.width, natural.height);
  const factor = (BADGE_SPAN * DIAMETER * mark.scale * area.height) / longest;
  if (!Number.isFinite(factor) || factor <= 0) return HIDDEN;
  return {
    left: mark.x * area.width - (natural.width * factor) / HALF,
    top: mark.y * area.height - (natural.height * factor) / HALF,
    factor,
    depth: Math.round(mark.scale * DEPTH_STEPS),
    visible: true,
  };
}

/** Valeur CSS de `transform` : translation puis échelle uniforme, rien d'autre. */
export const badgeTransform = (box: BadgeBox): string =>
  `translate(${box.left}px, ${box.top}px) scale(${box.factor})`;
