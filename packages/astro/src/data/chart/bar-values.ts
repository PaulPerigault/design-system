import type { BarRect, Formatter, Orientation, SeriesInk } from '@paulperigault/dataviz';
import type { Plot } from './bar-layout.ts';
import { CHAR_WIDTH, LINE_HEIGHT } from './bar-layout.ts';
import { WIDTH, px } from './frame.ts';
import { inkAttribute } from './ink.ts';

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
  /** Posée sur la barre : sa couleur suit le neutre de la série (`ValueGroup.ink`). */
  readonly inside: boolean;
}

/** Valeurs d'une série. `ink` : neutre du texte posé sur la barre, clair puis sombre (`bg-fg`). */
export interface ValueGroup {
  readonly series: number;
  readonly ink: string | undefined;
  readonly labels: readonly ValueLabel[];
}

/** Zone de tracé ; `inkable` : un neutre de texte atteint 4,5:1 sur la couleur de la série. */
interface Room {
  readonly plot: Plot;
  readonly inkable: boolean;
}

/** Une barre nulle n'a pas d'intérieur : sa valeur se pose toujours à son bout. */
const isInside = (rect: BarRect, roomy: boolean, inkable: boolean): boolean =>
  rect.value !== 0 && roomy && inkable;

type Place = (rect: BarRect, width: number, room: Room) => Omit<ValueLabel, 'text'> | null;

/**
 * Barre verticale : dans la barre si elle est assez haute, sinon au-dessus (valeur positive ou
 * nulle) ou au-dessous (négative) ; rien si la barre est plus étroite que le texte.
 */
const alongColumn: Place = (rect, width, { plot, inkable }) => {
  if (rect.width < width) return null;
  const inside = isInside(rect, rect.height >= LINE_HEIGHT + FRAME, inkable);
  const forward = rect.value >= 0;
  const edge = forward ? rect.y : rect.y + rect.height;
  const y = edge + (inside === forward ? INSET : -INSET);
  if (!inside && !forward && y + LINE_HEIGHT * HALF > plot.bottom) return null;
  return { anchor: 'middle', x: px(rect.x + rect.width * HALF), y: px(y), inside };
};

/**
 * Barre horizontale : dans la barre si elle est assez longue, sinon au bout, à droite (valeur
 * positive ou nulle) ou à gauche (négative), tant que le texte reste dans la zone de tracé.
 */
const alongRow: Place = (rect, width, { plot, inkable }) => {
  if (rect.height < MIN_THICKNESS) return null;
  const y = px(rect.y + rect.height * HALF);
  const inside = isInside(rect, rect.width >= width + FRAME, inkable);
  const forward = rect.value >= 0;
  const edge = forward ? rect.x + rect.width : rect.x;
  const x = edge + (inside === forward ? -PAD : PAD);
  const room = forward ? x + width <= WIDTH : x - width >= plot.left;
  if (!inside && !room) return null;
  return { anchor: inside === forward ? 'end' : 'start', x: px(x), y, inside };
};

/** Ce que `valueLabels` lit hors des barres : orientation, tracé, formatage, neutres de texte. */
export interface ValueContext {
  readonly orientation: Orientation;
  readonly plot: Plot;
  readonly fmt: Formatter;
  readonly inks: readonly SeriesInk[];
}

/**
 * Valeurs écrites contre les barres, groupées par série, tout ou rien : si une seule ne trouve pas
 * sa place, aucune n'est écrite (des valeurs sur certaines barres seulement se liraient comme une
 * différence de sens). Posée sur une barre, la valeur prend le neutre de sa série (≥ 4,5:1) ; hors
 * de la barre, la couleur du texte courant.
 */
export function valueLabels(
  rects: readonly BarRect[],
  { orientation, plot, fmt, inks }: ValueContext,
): readonly ValueGroup[] {
  const place = orientation === 'vertical' ? alongColumn : alongRow;
  const placed = rects.map((rect) => {
    const text = fmt.number(rect.value);
    const inkable = inkAttribute(inks[rect.series]) !== undefined;
    const found = place(rect, text.length * CHAR_WIDTH, { plot, inkable });
    return found === null ? null : { series: rect.series, label: { ...found, text } };
  });
  if (placed.some((item) => item === null)) return [];
  return inks.flatMap((ink, series) => {
    const labels = placed.flatMap((item) => (item?.series === series ? [item.label] : []));
    return labels.length === 0 ? [] : [{ series, ink: inkAttribute(ink), labels }];
  });
}
