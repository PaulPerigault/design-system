import type { Dataset, DatavizError, Formatter, Result } from '@paulperigault/dataviz';
import {
  checkSeriesCount,
  checkSharedUnit,
  createFormatter,
  parseDataset,
} from '@paulperigault/dataviz';
import { ChartError } from './errors.ts';
import type { LineModel } from './model.ts';
import { buildLineModel } from './model.ts';
import { summarize } from './summary.ts';
import type { TableModel } from './table.ts';
import { tableOf } from './table.ts';
import { presentValues } from './y-axis.ts';

export interface Prepared {
  readonly dataset: Dataset;
  readonly formatter: Formatter;
  readonly summary: string;
  readonly table: TableModel;
  /** Absent si le jeu ne contient aucune valeur (état vide) ou si le rendu est impossible. */
  readonly model: LineModel | undefined;
  readonly empty: boolean;
  /** Donnée valide mais rendu impossible : le tableau reste, avec une alerte. */
  readonly renderError: DatavizError | undefined;
}

/**
 * Valide à la frontière puis prépare le rendu. Une donnée invalide (code `dataset.*`,
 * `chart.*`) lève une `ChartError` : le build échoue avec le code lisible.
 */
export function prepareLine(input: unknown, locale: string, name: string): Prepared {
  const unwrap = <T>(result: Result<T>): T => {
    if (!result.ok) throw new ChartError(name, result.error);
    return result.value;
  };
  const formatter = unwrap(createFormatter(locale));
  const dataset = unwrap(checkSharedUnit(unwrap(checkSeriesCount(unwrap(parseDataset(input))))));
  const empty = presentValues(dataset.series).length === 0;
  const built = empty ? undefined : buildLineModel(dataset, formatter);
  return {
    dataset,
    formatter,
    summary: summarize(dataset, formatter),
    table: tableOf(dataset, formatter),
    model: built?.ok ? built.value : undefined,
    empty,
    renderError: built !== undefined && !built.ok ? built.error : undefined,
  };
}
