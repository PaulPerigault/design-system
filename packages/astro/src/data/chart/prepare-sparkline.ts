import type { Dataset, Result } from '@paulperigault/dataviz';
import { createFormatter, fail, ok, parseDataset } from '@paulperigault/dataviz';
import { unwrap } from './errors.ts';
import type { SparkModel } from './sparkline-model.ts';
import { buildSparkModel } from './sparkline-model.ts';
import type { SparkLabels } from './sparkline-text.ts';
import { SPARK_LABELS, describeSpark, sparkSwatches } from './sparkline-text.ts';
import type { Swatch } from './swatch.ts';
import type { TableModel } from './table.ts';
import { tableOf } from './table.ts';

/** Même forme que `Prepared` des courbes : le cadre commun s'en sert tel quel. */
export interface SparkPrepared {
  readonly model: SparkModel | undefined;
  readonly empty: boolean;
  readonly renderError: undefined;
  readonly table: TableModel;
  readonly description: string;
  readonly swatches: readonly Swatch[];
}

/** `chart.too-many-series` : une sparkline porte une seule série (les comparer : LineChart). */
function checkSingle(dataset: Dataset): Result<Dataset> {
  const count = dataset.series.length;
  if (count === 1) return ok(dataset);
  return fail('chart.too-many-series', `${count} séries ; une seule par sparkline.`, 'series');
}

/**
 * Valide à la frontière (jeu, série unique, géométrie : un code `dataset.*`, `chart.*`,
 * `sparkline.*` ou `geometry.*` fait échouer le build) puis prépare le rendu. Sans aucune valeur,
 * état vide : le tableau reste.
 */
export function prepareSparkline(
  input: unknown,
  text: { locale: string; title: string; labels: Partial<SparkLabels> },
  name: string,
): SparkPrepared {
  const fmt = unwrap(name, createFormatter(text.locale));
  const dataset = unwrap(name, checkSingle(unwrap(name, parseDataset(input))));
  const [series] = dataset.series;
  const table = tableOf(dataset, fmt);
  const base = { renderError: undefined, table };
  if (series === undefined || series.values.every((value) => value === null)) {
    return { ...base, model: undefined, empty: true, description: '', swatches: [] };
  }
  const model = buildSparkModel(dataset, name);
  const reading = { series, axis: dataset.x, fmt, labels: { ...SPARK_LABELS, ...text.labels } };
  return {
    ...base,
    model,
    empty: false,
    description: describeSpark(text.title, model, reading),
    swatches: sparkSwatches(model, reading),
  };
}
