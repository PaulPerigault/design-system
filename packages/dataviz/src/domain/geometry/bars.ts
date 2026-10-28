import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';
import { coord } from './format.ts';
import type { BandScale } from '../scale/band.ts';
import { bandScale } from '../scale/band.ts';
import type { LinearScale } from '../scale/linear.ts';

export type Orientation = 'vertical' | 'horizontal';

export interface BarRect {
  readonly series: number;
  /** Position de la catégorie sur l'axe de catégories. */
  readonly index: number;
  readonly value: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface BarsInput {
  readonly orientation: Orientation;
  /** Catégories : bandes sur X (vertical) ou sur Y (horizontal). */
  readonly categories: BandScale;
  /** Valeurs : doit déjà inverser Y pour les barres verticales (`verticalScale`). */
  readonly values: LinearScale;
  /** Une liste par série, même longueur que `categories.count` ; `null` laisse un vide. */
  readonly series: readonly (readonly (number | null)[])[];
  /** Remplissage entre barres d'un même groupe, de 0 à 1 exclu. */
  readonly innerPadding?: number;
}

const clamp = (value: number, [a, b]: readonly [number, number]): number =>
  Math.min(Math.max(value, Math.min(a, b)), Math.max(a, b));

/** Barres groupées : une sous-bande par série, rectangles de la base zéro à la valeur. */
export function barRects(input: BarsInput): Result<readonly BarRect[]> {
  const { categories, values, series, orientation, innerPadding = 0 } = input;
  if (series.some((list) => list.length !== categories.count)) {
    return fail(
      'geometry.bad-input',
      'Chaque série doit avoir une valeur par catégorie.',
      'series',
    );
  }
  const base = clamp(values.map(0), values.range);
  const rects: BarRect[] = [];
  for (let index = 0; index < categories.count; index += 1) {
    const start = categories.start(index);
    const inner = bandScale(series.length, [start, start + categories.bandwidth], innerPadding);
    if (!inner.ok) return inner;
    series.forEach((list, s) => {
      const value = list[index];
      if (value === null || value === undefined) return;
      const edge = clamp(values.map(value), values.range);
      const [low, size] = [Math.min(edge, base), Math.abs(edge - base)];
      const along = inner.value.start(s);
      const across = inner.value.bandwidth;
      rects.push(
        orientation === 'vertical'
          ? { series: s, index, value, x: along, y: low, width: across, height: size }
          : { series: s, index, value, x: low, y: along, width: size, height: across },
      );
    });
  }
  return ok(rects);
}

/** Chemin `d` des rectangles : un sous-chemin fermé par barre, sans balise. */
export const rectsPath = (rects: readonly BarRect[]): string =>
  rects
    .map(
      ({ x, y, width, height }) =>
        `M${coord(x)} ${coord(y)}h${coord(width)}v${coord(height)}h${coord(-width)}z`,
    )
    .join('');
