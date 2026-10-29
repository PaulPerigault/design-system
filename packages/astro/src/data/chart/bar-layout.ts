import { LABEL_GAP, PLOT } from './frame.ts';

/** Zone de tracé, en unités du viewBox. */
export interface Plot {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

/** Largeur d'un caractère et hauteur d'une ligne de texte, en unités du viewBox (police des jetons). */
export const CHAR_WIDTH = 8;
export const LINE_HEIGHT = 16;
/** Lignes d'un libellé de catégorie au plus : au-delà, troncature et texte complet en `<title>`. */
export const MAX_LABEL_LINES = 2;
/** Un libellé gardé montre au moins ce nombre de caractères : sinon on espace les libellés. */
export const MIN_SLOT_CHARS = 5;
/** Colonne des libellés des barres horizontales : de 72 à 22 caractères de large. */
const LABEL_CHARS_MAX = 22;
const COLUMN_MIN = PLOT.left;
/** Colonne des graduations de barres verticales : au moins ce nombre d'unités, pour 3 caractères. */
const VALUE_COLUMN_MIN = 32;

/** Espace entre groupes (0 à 1) et entre barres d'un même groupe. */
const GROUP_PADDING = 0.24;
const DENSE_PADDING = 0.45;
/** Sous ce pas par catégorie, le contour des barres mange l'espace : on l'élargit. */
const DENSE_STEP = 12;
export const BAR_PADDING = 0.12;

/** Remplissage entre groupes pour `count` catégories sur `length` unités. */
export const groupPadding = (count: number, length: number): number =>
  length / Math.max(1, count) < DENSE_STEP ? DENSE_PADDING : GROUP_PADDING;

/**
 * Zone de tracé. Barres verticales : la colonne de gauche ne garde que la place des graduations
 * (la plus large de `ticks`), le reste va aux catégories. Barres horizontales : la colonne
 * s'élargit pour les libellés.
 */
export function barPlot(
  orientation: 'vertical' | 'horizontal',
  labels: readonly string[],
  ticks: readonly string[] = [],
): Plot {
  if (orientation === 'vertical') {
    const widest = Math.max(0, ...ticks.map((tick) => tick.length));
    return { ...PLOT, left: Math.max(VALUE_COLUMN_MIN, widest * CHAR_WIDTH + LABEL_GAP) };
  }
  const longest = Math.min(LABEL_CHARS_MAX, Math.max(0, ...labels.map((label) => label.length)));
  return { ...PLOT, left: Math.max(COLUMN_MIN, longest * CHAR_WIDTH + LABEL_GAP) };
}
