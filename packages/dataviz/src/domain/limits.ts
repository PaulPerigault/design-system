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

/** Plafond de catégories d'un graphique en barres (ADR-0007, D-042). */
export const MAX_BAR_CATEGORIES = 40;

/**
 * `bar.too-many-categories` : au-delà de 40 catégories, des barres deviennent illisibles ;
 * passer à une courbe ou agréger (tri et regroupement « autres »).
 */
export function checkBarCategories(dataset: Dataset): Result<Dataset> {
  const count = dataset.x.values.length;
  if (count <= MAX_BAR_CATEGORIES) return ok(dataset);
  return fail(
    'bar.too-many-categories',
    `${count} catégories ; ${MAX_BAR_CATEGORIES} au plus. Passez à une courbe ou agrégez.`,
    'x.values',
  );
}

/** `dataset.unit-mismatch` : deux unités différentes ne partagent pas un axe. */
export function checkSharedUnit(dataset: Dataset): Result<Dataset> {
  const units = new Set(dataset.series.map((series) => series.unit));
  if (units.size <= 1) return ok(dataset);
  return fail('dataset.unit-mismatch', `Unités mêlées : ${[...units].join(', ')}.`, 'series');
}
