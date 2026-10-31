import type { Dataset, Series } from '../dataset.ts';
import { DATASET_SCHEMA, MAX_POINTS } from '../dataset.ts';
import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';
import { groupByLabel } from './groups.ts';
import type { Groups } from './groups.ts';
import { timeKey } from './keys.ts';
import { reduceValues } from './operations.ts';
import { checkSpec } from './spec.ts';
import type { AggregateSpec } from './spec.ts';

/** Forme du jeu : non vide, au plus `MAX_POINTS` points, une valeur par point et par série. */
function checkShape(dataset: Dataset): Result<Dataset> {
  const count = dataset.x.values.length;
  if (count === 0 || dataset.series.length === 0) {
    return fail('dataset.empty', 'Au moins un point et une série sont requis.', 'x.values');
  }
  if (count > MAX_POINTS) {
    return fail('dataset.too-many-points', `Plus de ${MAX_POINTS} points.`, 'x.values');
  }
  const bad = dataset.series.findIndex((series) => series.values.length !== count);
  return bad < 0
    ? ok(dataset)
    : fail(
        'dataset.length-mismatch',
        `Série ${bad} : ${count} valeurs attendues.`,
        `series[${bad}]`,
      );
}

/** Une valeur `NaN` ou infinie est refusée ; `null` (manquante) est permise. */
function checkFinite(dataset: Dataset): Result<Dataset> {
  for (const [row, series] of dataset.series.entries()) {
    const column = series.values.findIndex((value) => value !== null && !Number.isFinite(value));
    if (column >= 0) {
      return fail('dataset.non-finite', 'Valeur non finie.', `series[${row}].values[${column}]`);
    }
  }
  return ok(dataset);
}

/** L'axe doit être `category` pour `category`, `time` pour un pas de temps. */
function checkAxis(dataset: Dataset, spec: AggregateSpec): Result<Dataset> {
  const wanted = spec.by === 'category' ? 'category' : 'time';
  return dataset.x.kind === wanted ? ok(dataset) : axisError(wanted, dataset.x.kind);
}

/** Libellé de groupe de chaque point (l'axe a déjà été contrôlé). */
function keysOf(dataset: Dataset, spec: AggregateSpec): Result<readonly string[]> {
  const { x } = dataset;
  if (spec.by === 'category') {
    return x.kind === 'category' ? ok(x.values) : axisError('category', x.kind);
  }
  if (x.kind !== 'time') return axisError('time', x.kind);
  const keys: string[] = [];
  for (const [index, text] of x.values.entries()) {
    const key = timeKey(spec.by, text);
    if (!key.ok) return fail('dataset.bad-date', key.error.message, `x.values[${index}]`);
    keys.push(key.value);
  }
  return ok(keys);
}

const axisError = (wanted: string, found: string): Result<never> =>
  fail('aggregate.bad-axis', `Axe « ${wanted} » attendu, « ${found} » reçu.`, 'x.kind');

function reduceSeries(series: Series, groups: Groups, spec: AggregateSpec): Series {
  const values = groups.members.map((indices) =>
    reduceValues(
      spec.operation,
      indices.flatMap((index) => series.values[index] ?? []),
    ),
  );
  return { ...series, unit: spec.operation === 'count' ? '' : series.unit, values };
}

/**
 * Agrège chaque série par groupe (catégorie, jour, mois ou année UTC). Groupes dans l'ordre de
 * première apparition ; `first` et `last` suivent l'ordre des données ; `count` ne compte que les
 * valeurs non nulles ; un groupe sans valeur donne `null`. Les erreurs sont contrôlées dans
 * l'ordre : spécification, axe, forme, valeurs finies, dates.
 */
export function aggregate(dataset: Dataset, spec: AggregateSpec): Result<Dataset> {
  const checked = checkSpec(spec);
  if (!checked.ok) return checked;
  const valid = [checkAxis(dataset, checked.value), checkShape(dataset), checkFinite(dataset)];
  const refused = valid.find((result) => !result.ok);
  if (refused && !refused.ok) return refused;
  const keys = keysOf(dataset, checked.value);
  if (!keys.ok) return keys;
  const groups = groupByLabel(keys.value);
  const kind = checked.value.by === 'category' ? 'category' : 'time';
  return ok({
    schema: DATASET_SCHEMA,
    x: { kind, label: dataset.x.label, values: groups.labels },
    series: dataset.series.map((series) => reduceSeries(series, groups, checked.value)),
  });
}
