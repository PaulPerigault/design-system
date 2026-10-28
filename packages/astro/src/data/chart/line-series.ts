import type { PathPoint, Result, Series } from '@paulperigault/dataviz';
import { linePath, lttb, ok } from '@paulperigault/dataviz';
import { MARKER_LIMIT, MAX_POINTS_PER_SERIES, POINT_BUDGET } from './frame.ts';
import { markerPath } from './markers.ts';

export interface SeriesModel {
  readonly id: string;
  readonly label: string;
  /** Rang de la série (0 à 5) : couleur, motif de trait et marqueur. */
  readonly index: number;
  readonly d: string;
  readonly markers: string;
  readonly missing: number;
}

/** Échelles communes à toutes les séries d'un graphique et cible de points par série. */
export interface Scene {
  readonly xs: readonly number[];
  readonly y: (value: number) => number;
  readonly target: number;
}

type Pixel = { readonly x: number; readonly y: number };

/** Points par série : 500 au plus (ADR-0007), et le budget de 10 ko partagé entre les séries. */
export const pointTarget = (seriesCount: number): number =>
  Math.min(MAX_POINTS_PER_SERIES, Math.floor(POINT_BUDGET / Math.max(1, seriesCount)));

/** Indices conservés : tous sous la cible, sinon LTTB (premier, dernier et trous gardés). */
function keptIndices(xs: readonly number[], values: Series['values'], target: number) {
  if (values.length <= target) return ok(values.map((_, i) => i));
  return lttb(xs, values, target);
}

/** Marqueurs : tous les points sous la limite, sinon les points isolés et le dernier. */
function markedPoints(present: readonly Pixel[], isolated: readonly Pixel[]): readonly Pixel[] {
  if (present.length <= MARKER_LIMIT) return present;
  const last = present[present.length - 1];
  return last === undefined ? isolated : [...isolated, last];
}

/** Tracé, marqueurs et nombre de données manquantes d'une série, en coordonnées du viewBox. */
export function buildSeries(series: Series, index: number, scene: Scene): Result<SeriesModel> {
  const { xs, y, target } = scene;
  const kept = keptIndices(xs, series.values, target);
  if (!kept.ok) return kept;
  const points = kept.value.map((i): PathPoint => {
    const value = series.values[i];
    return { x: xs[i] ?? 0, y: value === null || value === undefined ? null : y(value) };
  });
  const line = linePath(points);
  if (!line.ok) return line;
  const present = points.flatMap((p): Pixel[] => (p.y === null ? [] : [{ x: p.x, y: p.y }]));
  const markers = markedPoints(present, line.value.isolated)
    .map((p) => markerPath(index, p.x, p.y))
    .join('');
  const missing = series.values.filter((value) => value === null).length;
  return ok({ id: series.id, label: series.label, index, d: line.value.d, markers, missing });
}
