import type { BarRect, Formatter, Orientation } from '@paulperigault/dataviz';
import type { Plot } from './bar-layout.ts';
import { CHAR_WIDTH, LINE_HEIGHT } from './bar-layout.ts';
import { WIDTH, px } from './frame.ts';

const HALF = 0.5;
const PAD = 4;
const FRAME = PAD + PAD;
const INSET = PAD + LINE_HEIGHT * HALF;
/** Épaisseur minimale d'une barre horizontale pour porter une valeur sans chevaucher sa voisine. */
const MIN_THICKNESS = 12;

/** Valeur écrite contre une barre ; `anchor` choisit l'ancrage du texte en CSS. */
export interface ValueLabel {
  readonly text: string;
  readonly anchor: 'start' | 'middle' | 'end';
  readonly x: number;
  readonly y: number;
}

/** Une barre nulle n'a pas d'intérieur : sa valeur se pose toujours à son bout. */
const isInside = (rect: BarRect, roomy: boolean): boolean => rect.value !== 0 && roomy;

type Place = (rect: BarRect, width: number, plot: Plot) => ValueLabel | null;

/**
 * Barre verticale : dans la barre si elle est assez haute, sinon au-dessus (valeur positive ou
 * nulle) ou au-dessous (négative) ; rien si la barre est plus étroite que le texte.
 */
const alongColumn: Place = (rect, width, plot) => {
  if (rect.width < width) return null;
  const inside = isInside(rect, rect.height >= LINE_HEIGHT + FRAME);
  const forward = rect.value >= 0;
  const edge = forward ? rect.y : rect.y + rect.height;
  const y = edge + (inside === forward ? INSET : -INSET);
  if (!inside && !forward && y + LINE_HEIGHT * HALF > plot.bottom) return null;
  return { text: '', anchor: 'middle', x: px(rect.x + rect.width * HALF), y: px(y) };
};

/**
 * Barre horizontale : dans la barre si elle est assez longue, sinon au bout, à droite (valeur
 * positive ou nulle) ou à gauche (négative), tant que le texte reste dans la zone de tracé.
 */
const alongRow: Place = (rect, width, plot) => {
  if (rect.height < MIN_THICKNESS) return null;
  const y = px(rect.y + rect.height * HALF);
  const inside = isInside(rect, rect.width >= width + FRAME);
  const forward = rect.value >= 0;
  const edge = forward ? rect.x + rect.width : rect.x;
  const x = edge + (inside === forward ? -PAD : PAD);
  const room = forward ? x + width <= WIDTH : x - width >= plot.left;
  if (!inside && !room) return null;
  return { text: '', anchor: inside === forward ? 'end' : 'start', x: px(x), y };
};

/**
 * Valeurs écrites contre les barres, tout ou rien : si une seule ne trouve pas sa place, aucune
 * n'est écrite (des valeurs sur certaines barres seulement se liraient comme une différence de sens).
 */
export function valueLabels(
  rects: readonly BarRect[],
  orientation: Orientation,
  plot: Plot,
  fmt: Formatter,
): readonly ValueLabel[] {
  const place = orientation === 'vertical' ? alongColumn : alongRow;
  const labels = rects.map((rect) => {
    const text = fmt.number(rect.value);
    const found = place(rect, text.length * CHAR_WIDTH, plot);
    return found === null ? null : { ...found, text };
  });
  return labels.every((label) => label !== null) ? labels : [];
}
