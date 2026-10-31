import type { AggregateSpec, Aggregator, Dataset, Result } from '@paulperigault/dataviz';
import {
  DATASET_SCHEMA,
  checkAggregateAxis,
  checkAggregateShape,
  checkAggregateSpec,
  ok,
} from '@paulperigault/dataviz';
import { flatten, unflatten } from './pack.ts';
import { run } from './runtime.ts';

const labelsOf = (dataset: Dataset): string[] =>
  dataset.x.kind === 'number' ? [] : [...dataset.x.values];

/**
 * Agrège par catégorie ou pas de temps, mêmes règles et mêmes erreurs que `aggregate` de `dataviz`.
 * La spécification, l'axe et la forme sont contrôlés ici, avec les fonctions de la référence ; les
 * valeurs finies, les dates et le calcul sont ceux du `.wasm`.
 */
export function aggregate(dataset: Dataset, spec: AggregateSpec): Result<Dataset> {
  const checked = checkAggregateSpec(spec);
  if (!checked.ok) return checked;
  const refused = [checkAggregateAxis(dataset, checked.value), checkAggregateShape(dataset)].find(
    (result) => !result.ok,
  );
  if (refused && !refused.ok) return refused;
  const { values, missing } = flatten(dataset.series);
  const { by, operation } = checked.value;
  const result = run('aggregate', (raw) => {
    const out = raw.aggregate(labelsOf(dataset), values, missing, by, operation);
    try {
      return { labels: out.labels, values: out.values };
    } finally {
      out.free();
    }
  });
  if (!result.ok) return result;
  const rows = unflatten(result.value.values, result.value.labels.length);
  return ok({
    schema: DATASET_SCHEMA,
    x: {
      kind: by === 'category' ? 'category' : 'time',
      label: dataset.x.label,
      values: result.value.labels,
    },
    series: dataset.series.map((series, index) => ({
      ...series,
      unit: operation === 'count' ? '' : series.unit,
      values: rows[index] ?? [],
    })),
  });
}

/** Le port `Aggregator` de `dataviz` implémenté par le `.wasm` (ADR-0007). */
export const createWasmAggregator = (): Aggregator => ({ aggregate });
