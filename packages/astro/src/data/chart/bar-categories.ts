import type { BandScale, Orientation } from '@paulperigault/dataviz';
import type { Plot } from './bar-layout.ts';
import { CHAR_WIDTH, LINE_HEIGHT, MAX_LABEL_LINES, MIN_SLOT_CHARS } from './bar-layout.ts';
import { LABEL_GAP, X_LABEL_DROP, px } from './frame.ts';
import type { FittedLabel } from './labels.ts';
import { fitLabel } from './labels.ts';

const HALF = 0.5;

/** Libellé de catégorie positionné : `axis` choisit l'ancrage en CSS (x : centré, y : à droite). */
export interface CategoryLabel extends FittedLabel {
  readonly axis: 'x' | 'y';
  readonly x: number;
  readonly y: number;
}

/** Une catégorie sur `stride` reçoit un libellé, pour que chacun ait de la place. */
const strideOf = (step: number, orientation: Orientation): number =>
  Math.max(
    1,
    Math.ceil((orientation === 'vertical' ? MIN_SLOT_CHARS * CHAR_WIDTH : LINE_HEIGHT) / step),
  );

/** Libellés des catégories (retour à la ligne, troncature, espacement), placés selon l'orientation. */
export function categoryLabels(
  labels: readonly string[],
  scale: BandScale,
  orientation: Orientation,
  plot: Plot,
): readonly CategoryLabel[] {
  const vertical = orientation === 'vertical';
  const stride = strideOf(scale.step, orientation);
  const slot = scale.step * stride;
  const chars = vertical
    ? Math.floor(slot / CHAR_WIDTH)
    : Math.floor((plot.left - LABEL_GAP) / CHAR_WIDTH);
  const lines = vertical
    ? MAX_LABEL_LINES
    : Math.max(1, Math.min(MAX_LABEL_LINES, Math.floor(slot / LINE_HEIGHT)));
  return labels.flatMap((text, index): CategoryLabel[] => {
    if (index % stride !== 0) return [];
    const fitted = fitLabel(text, chars, lines);
    const middle = scale.start(index) + scale.bandwidth * HALF;
    if (vertical) {
      return [{ ...fitted, axis: 'x', x: px(middle), y: plot.bottom + X_LABEL_DROP }];
    }
    const shift = (fitted.lines.length - 1) * LINE_HEIGHT * HALF;
    return [{ ...fitted, axis: 'y', x: plot.left - LABEL_GAP, y: px(middle - shift) }];
  });
}
