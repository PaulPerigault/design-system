import type { Dataset } from './dataset.ts';
import { MAX_SERIES } from './dataset.ts';
import type { Result } from './result.ts';
import { fail, ok } from './result.ts';

/** `chart.too-many-series` : au-delà de 6 séries on regroupe, on n'étire pas la palette. */
export function checkSeriesCount(dataset: Dataset): Result<Dataset> {
  const count = dataset.series.length;
  if (count <= MAX_SERIES) return ok(dataset);
  return fail('chart.too-many-series', `${count} séries ; ${MAX_SERIES} au plus.`, 'series');
}

/** `dataset.unit-mismatch` : deux unités différentes ne partagent pas un axe. */
export function checkSharedUnit(dataset: Dataset): Result<Dataset> {
  const units = new Set(dataset.series.map((series) => series.unit));
  if (units.size <= 1) return ok(dataset);
  return fail('dataset.unit-mismatch', `Unités mêlées : ${[...units].join(', ')}.`, 'series');
}
