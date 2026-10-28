import type { Axis, Dataset, Series } from '../domain/dataset.ts';
import { DATASET_SCHEMA, MAX_POINTS } from '../domain/dataset.ts';
import type { Result } from '../domain/result.ts';
import { fail, ok } from '../domain/result.ts';
import { isRecord } from './guards.ts';
import { parseAxis } from './parse-axis.ts';
import { parseSeries } from './parse-series.ts';

function parseAllSeries(input: unknown): Result<Series[]> {
  if (!Array.isArray(input))
    return fail('dataset.bad-shape', '`series` : liste attendue.', 'series');
  if (input.length === 0) return fail('dataset.empty', 'Au moins une série est requise.', 'series');
  const all: Series[] = [];
  for (const [index, item] of input.entries()) {
    const series = parseSeries(item, index);
    if (!series.ok) return series;
    all.push(series.value);
  }
  return ok(all);
}

function checkConsistency(x: Axis, series: readonly Series[]): Result<Dataset> {
  if (x.values.length === 0) return fail('dataset.empty', "L'axe x est vide.", 'x.values');
  if (x.values.length > MAX_POINTS) {
    return fail('dataset.too-many-points', `Plus de ${MAX_POINTS} points.`, 'x.values');
  }
  const ids = new Set<string>();
  for (const [index, item] of series.entries()) {
    if (ids.has(item.id))
      return fail('dataset.duplicate-id', `id « ${item.id} » en double.`, `series[${index}].id`);
    ids.add(item.id);
    if (item.values.length !== x.values.length) {
      return fail(
        'dataset.length-mismatch',
        `${item.values.length} valeurs pour ${x.values.length} points.`,
        `series[${index}].values`,
      );
    }
  }
  return ok({ schema: DATASET_SCHEMA, x, series });
}

/** Frontière : toute entrée (JSON, fichier, sortie de `pp-data`) devient un `Dataset` ou une erreur. */
export function parseDataset(input: unknown): Result<Dataset> {
  if (!isRecord(input) || input['schema'] !== DATASET_SCHEMA) {
    return fail('dataset.bad-shape', `Objet avec schema: ${DATASET_SCHEMA} attendu.`);
  }
  const x = parseAxis(input['x']);
  if (!x.ok) return x;
  const series = parseAllSeries(input['series']);
  return series.ok ? checkConsistency(x.value, series.value) : series;
}
