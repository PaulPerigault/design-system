import type { Dataset, Formatter, Result } from '@paulperigault/dataviz';
import { fail, ok } from '@paulperigault/dataviz';
import { PLOT } from './frame.ts';
import type { SeriesModel } from './line-series.ts';
import { buildSeries, pointTarget } from './line-series.ts';
import { buildXAxis } from './x-axis.ts';
import type { XTick } from './x-axis.ts';
import type { YAxis } from './y-axis.ts';
import { buildYAxis, presentValues } from './y-axis.ts';

export interface LineModel {
  /** Lignes horizontales de la grille : un seul chemin. */
  readonly grid: string;
  readonly yTicks: YAxis['ticks'];
  readonly xTicks: readonly XTick[];
  readonly unit: string;
  readonly offZero: boolean;
  readonly series: readonly SeriesModel[];
}

const gridPath = (ticks: YAxis['ticks']): string =>
  ticks.map(({ y }) => `M${PLOT.left} ${y}H${PLOT.right}`).join('');

/** Géométrie complète d'une courbe multiséries ; `scale.*`, `geometry.*` ou `downsample.*` sinon. */
export function buildLineModel(dataset: Dataset, fmt: Formatter): Result<LineModel> {
  const values = presentValues(dataset.series);
  if (values.length === 0) return fail('dataset.empty', 'Aucune valeur à tracer.', 'series');
  const x = buildXAxis(dataset.x, fmt);
  if (!x.ok) return x;
  const y = buildYAxis(values, fmt);
  if (!y.ok) return y;
  const target = pointTarget(dataset.series.length);
  const series: SeriesModel[] = [];
  for (const [index, item] of dataset.series.entries()) {
    const built = buildSeries(item, index, { xs: x.value.xs, y: y.value.map, target });
    if (!built.ok) return built;
    series.push(built.value);
  }
  return ok({
    grid: gridPath(y.value.ticks),
    yTicks: y.value.ticks,
    xTicks: x.value.ticks,
    unit: dataset.series[0]?.unit ?? '',
    offZero: y.value.offZero,
    series,
  });
}
