/**
 * Placement des étiquettes de la scène (pur, sans DOM) : une étiquette sous chaque médaille, posée
 * avec `project()` du paquet 3D. Cachée si la médaille est invisible ou hors cadre ; entre deux
 * étiquettes qui se chevauchent, l'active passe d'abord, puis la plus proche de l'active.
 */
import type { Mark } from './milestones-3d-types';

export interface Size {
  width: number;
  height: number;
}

export interface Placed {
  /** Coin haut gauche de l'étiquette, en pixels CSS dans le repère de la scène. */
  left: number;
  top: number;
  visible: boolean;
}

/** Espace entre le bord de la médaille et son étiquette, en pixels CSS. */
export const LABEL_GAP_PX = 8;
const HALF = 2;
/** L'étiquette part du bas de l'anneau (un peu plus large que la médaille), pas de la médaille. */
const RING_FACTOR = 1.12;

interface Box extends Size {
  left: number;
  top: number;
}

const overlaps = (a: Box, b: Box): boolean =>
  a.left < b.left + b.width &&
  b.left < a.left + a.width &&
  a.top < b.top + b.height &&
  b.top < a.top + a.height;

const inside = (box: Box, area: Size): boolean =>
  box.left >= 0 &&
  box.top >= 0 &&
  box.left + box.width <= area.width &&
  box.top + box.height <= area.height;

/** L'étiquette tient dans le cadre et ne chevauche aucune étiquette déjà gardée. */
const fits = (box: Box, area: Size, kept: readonly Box[]): boolean =>
  inside(box, area) && !kept.some((other) => overlaps(box, other));

/** Marge autour de la médaille active : l'anneau de survol dépasse du rayon. */
const RING_MARGIN = 1.2;

interface Disc {
  id: string;
  x: number;
  y: number;
  radius: number;
}

/** Une étiquette ne recouvre aucune médaille visible (la sienne exceptée) : rien sur les badges. */
function hitsDisc(box: Box, discs: readonly Disc[]): boolean {
  return discs.some((disc) => {
    const nearestX = Math.min(Math.max(disc.x, box.left), box.left + box.width);
    const nearestY = Math.min(Math.max(disc.y, box.top), box.top + box.height);
    return Math.hypot(nearestX - disc.x, nearestY - disc.y) < disc.radius * RING_MARGIN;
  });
}

function boxOf(mark: Mark, size: Size, area: Size): Box {
  const radius = mark.scale * area.height * RING_FACTOR;
  return {
    ...size,
    left: mark.x * area.width - size.width / HALF,
    top: mark.y * area.height + radius + LABEL_GAP_PX,
  };
}

/** Résultat par identifiant ; `sizes` donne la taille mesurée de chaque étiquette. */
export function placeLabels(
  marks: readonly Mark[],
  sizes: ReadonlyMap<string, Size>,
  area: Size,
  activeId: string | null,
): Map<string, Placed> {
  const active = marks.find((mark) => mark.id === activeId);
  const distance = (mark: Mark): number =>
    mark.id === activeId
      ? -1
      : Math.hypot(mark.x - (active?.x ?? HALF), mark.y - (active?.y ?? HALF));
  const discs: Disc[] = marks
    .filter((mark) => mark.visible)
    .map((mark) => ({
      id: mark.id,
      x: mark.x * area.width,
      y: mark.y * area.height,
      radius: mark.scale * area.height,
    }));
  const placed = new Map<string, Placed>();
  const kept: Box[] = [];
  for (const mark of [...marks].sort((a, b) => distance(a) - distance(b))) {
    const box = boxOf(mark, sizes.get(mark.id) ?? { width: 0, height: 0 }, area);
    const clear = !hitsDisc(
      box,
      discs.filter((disc) => disc.id !== mark.id),
    );
    const visible = mark.visible && clear && fits(box, area, kept);
    if (visible) kept.push(box);
    placed.set(mark.id, { left: box.left, top: box.top, visible });
  }
  return placed;
}
