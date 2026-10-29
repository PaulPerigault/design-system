import type { Dataset, Formatter, Result } from '@paulperigault/dataviz';
import { fail, ok, stackSeries } from '@paulperigault/dataviz';
import { areaIndices, areaTarget } from './area-indices.ts';
import type { AreaLayer } from './area-layers.ts';
import { buildLayers } from './area-layers.ts';
import type { AxesModel } from './axes.ts';
import { lineAxes } from './axes.ts';
import { PLOT } from './frame.ts';
import { gridPath } from './model.ts';
import type { XAxis } from './x-axis.ts';
import { buildXAxis } from './x-axis.ts';
import type { YAxis } from './y-axis.ts';
import { buildYAxis } from './y-axis.ts';

type Column = readonly (number | null)[];

/** Nombre de séries à partir duquel les aires s'empilent. */
export const MIN_STACK = 2;

export interface AreaModel {
  readonly axes: AxesModel;
  /** Vrai pour plusieurs séries : chaque couche repose sur celles d'en dessous. */
  readonly stacked: boolean;
  readonly layers: readonly AreaLayer[];
}

/** Hauts de couches : le cumul pour plusieurs séries (`stack.*` si invalide), sinon la série. */
function topsOf(dataset: Dataset): Result<readonly Column[]> {
  const columns = dataset.series.map((series) => series.values);
  if (columns.length < MIN_STACK) return ok(columns);
  const stack = stackSeries(columns);
  return stack.ok ? ok(stack.value.map((layer) => layer.upper)) : stack;
}

interface Scale {
  readonly x: XAxis;
  readonly y: YAxis;
}

/** Axes de l'aire : abscisses du jeu, ordonnée qui contient toujours zéro. */
function scaleOf(dataset: Dataset, heights: readonly number[], fmt: Formatter): Result<Scale> {
  const x = buildXAxis(dataset.x, fmt);
  if (!x.ok) return x;
  const y = buildYAxis([0, ...heights], fmt);
  return y.ok ? ok({ x: x.value, y: y.value }) : y;
}

/**
 * Géométrie d'une aire, simple ou empilée (`stack.negative-value` si une valeur est négative). La
 * base est toujours zéro : une aire dont la base flotte ne se lit pas.
 */
export function buildAreaModel(dataset: Dataset, fmt: Formatter): Result<AreaModel> {
  const tops = topsOf(dataset);
  if (!tops.ok) return tops;
  const heights = tops.value.flatMap((top) => top.filter((v): v is number => v !== null));
  if (heights.length === 0) return fail('dataset.empty', 'Aucune valeur à tracer.', 'series');
  const scale = scaleOf(dataset, heights, fmt);
  if (!scale.ok) return scale;
  const { x, y } = scale.value;
  const kept = areaIndices(x.xs, tops.value, areaTarget(dataset.series.length));
  if (!kept.ok) return kept;
  const baseline = y.map(0);
  const layers = buildLayers(dataset.series, tops.value, {
    xs: x.xs,
    y: y.map,
    baseline,
    kept: kept.value,
  });
  if (!layers.ok) return layers;
  const unit = dataset.series[0]?.unit ?? '';
  const axes = lineAxes({ grid: gridPath(y.ticks), yTicks: y.ticks, xTicks: x.ticks, unit });
  return ok({
    axes: { ...axes, axis: `M${PLOT.left} ${baseline}H${PLOT.right}` },
    stacked: dataset.series.length >= MIN_STACK,
    layers: layers.value,
  });
}
