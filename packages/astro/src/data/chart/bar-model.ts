import type {
  BandScale,
  BarRect,
  Dataset,
  Formatter,
  Orientation,
  Result,
} from '@paulperigault/dataviz';
import { bandScale, barRects, fail, ok, rectsPath } from '@paulperigault/dataviz';
import type { AxesModel } from './axes.ts';
import type { CategoryLabel } from './bar-categories.ts';
import { categoryLabels } from './bar-categories.ts';
import { buildBarAxis, valueTickLabels } from './bar-axis.ts';
import type { Plot } from './bar-layout.ts';
import { BAR_PADDING, barPlot, groupPadding } from './bar-layout.ts';
import type { ValueGroup } from './bar-values.ts';
import { valueLabels } from './bar-values.ts';
import { xLabel } from './found.ts';
import { SERIES_INKS } from './ink.ts';
import { presentValues } from './y-axis.ts';

export interface BarOptions {
  readonly orientation: Orientation;
  /** Écrit la valeur dans chaque barre, si elles tiennent toutes. */
  readonly showValues: boolean;
}

export interface BarSeriesModel {
  readonly index: number;
  readonly label: string;
  /** Rectangles de la série : un seul chemin. */
  readonly d: string;
}

export interface BarModel {
  readonly axes: AxesModel;
  readonly categories: readonly CategoryLabel[];
  readonly series: readonly BarSeriesModel[];
  readonly values: readonly ValueGroup[];
}

const seriesModels = (dataset: Dataset, rects: readonly BarRect[]): BarSeriesModel[] =>
  dataset.series.map((series, index) => ({
    index,
    label: series.label,
    d: rectsPath(rects.filter((rect) => rect.series === index)),
  }));

/** Bandes des catégories le long de l'axe qui les porte (abscisse ou ordonnée). */
function categoryScale(count: number, orientation: Orientation, plot: Plot): Result<BandScale> {
  const [start, end] =
    orientation === 'vertical' ? [plot.left, plot.right] : [plot.top, plot.bottom];
  return bandScale(count, [start, end], groupPadding(count, Math.abs(end - start)));
}

/** Géométrie des barres ; `scale.*` ou `geometry.*` si elle échoue, `dataset.empty` sans valeur. */
export function buildBarModel(
  dataset: Dataset,
  fmt: Formatter,
  options: BarOptions,
): Result<BarModel> {
  if (presentValues(dataset.series).length === 0) {
    return fail('dataset.empty', 'Aucune valeur à tracer.', 'series');
  }
  const { orientation, showValues } = options;
  if (!SERIES_INKS.ok) return SERIES_INKS;
  const labels = dataset.x.values.map((_, index) => xLabel(dataset.x, index, fmt));
  const plot = barPlot(orientation, labels, valueTickLabels(dataset.series, fmt));
  const axis = buildBarAxis(dataset.series, orientation, plot, fmt);
  if (!axis.ok) return axis;
  const categories = categoryScale(labels.length, orientation, plot);
  if (!categories.ok) return categories;
  const rects = barRects({
    orientation,
    categories: categories.value,
    values: axis.value.scale,
    series: dataset.series.map((series) => series.values),
    innerPadding: dataset.series.length > 1 ? BAR_PADDING : 0,
  });
  if (!rects.ok) return rects;
  return ok({
    axes: axis.value.axes,
    categories: categoryLabels(labels, categories.value, orientation, plot),
    series: seriesModels(dataset, rects.value),
    values: showValues
      ? valueLabels(rects.value, { orientation, plot, fmt, inks: SERIES_INKS.value })
      : [],
  });
}
