import type { PathPoint, Result, Series } from '@paulperigault/dataviz';
import { areaPath, ok } from '@paulperigault/dataviz';
import { markerPath } from './markers.ts';

type Column = readonly (number | null)[];

export interface AreaLayer {
  readonly index: number;
  readonly label: string;
  /** Tracé fermé de la couche, du haut de la couche à la ligne de base : aire et contour. */
  readonly d: string;
  /** Marqueurs des points isolés, qu'une aire sans voisin ne dessine pas. */
  readonly markers: string;
  readonly missing: number;
}

/** Échelles communes aux couches : abscisses, ordonnée, base et positions conservées. */
export interface AreaScene {
  readonly xs: readonly number[];
  readonly y: (value: number) => number;
  readonly baseline: number;
  readonly kept: readonly number[];
}

function buildLayer(series: Series, index: number, top: Column, scene: AreaScene) {
  const points = scene.kept.map((i): PathPoint => {
    const value = top[i];
    return {
      x: scene.xs[i] ?? 0,
      y: value === null || value === undefined ? null : scene.y(value),
    };
  });
  const area = areaPath(points, scene.baseline);
  if (!area.ok) return area;
  const markers = area.value.isolated.map((p) => markerPath(index, p.x, p.y)).join('');
  const missing = series.values.filter((value) => value === null).length;
  return ok({
    index,
    label: series.label,
    d: area.value.d,
    markers,
    missing,
  });
}

/** Une couche par série, dans l'ordre des séries : `tops[i]` est le haut de la couche `i`. */
export function buildLayers(
  series: readonly Series[],
  tops: readonly Column[],
  scene: AreaScene,
): Result<readonly AreaLayer[]> {
  const layers: AreaLayer[] = [];
  for (const [index, item] of series.entries()) {
    const built = buildLayer(item, index, tops[index] ?? [], scene);
    if (!built.ok) return built;
    layers.push(built.value);
  }
  return ok(layers);
}
