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

export interface Prepared<M> {
  readonly dataset: Dataset;
  readonly formatter: Formatter;
  readonly summary: string;
  readonly table: TableModel;
  /** Absent si le jeu ne contient aucune valeur (état vide) ou si le rendu est impossible. */
  readonly model: M | undefined;
  readonly empty: boolean;
  /** Donnée valide mais rendu impossible : le tableau reste, avec une alerte. */
  readonly renderError: DatavizError | undefined;
}

/** Ce qui distingue un type de graphique : limites propres, géométrie et résumé. */
export interface Kind<M> {
  /** Limites propres au graphique, après les limites communes (séries, unité). */
  readonly check?: (dataset: Dataset) => Result<Dataset>;
  readonly build: (dataset: Dataset, fmt: Formatter) => Result<M>;
  readonly summarize: (dataset: Dataset, fmt: Formatter) => string;
}

/**
 * Valide à la frontière puis prépare le rendu. Une donnée invalide (code `dataset.*`,
 * `chart.*`, `bar.*`) lève une `ChartError` : le build échoue avec le code lisible.
 */
export function prepare<M>(
  input: unknown,
  locale: string,
  name: string,
  kind: Kind<M>,
): Prepared<M> {
  const unwrap = <T>(result: Result<T>): T => {
    if (!result.ok) throw new ChartError(name, result.error);
    return result.value;
  };
  const formatter = unwrap(createFormatter(locale));
  const common = unwrap(checkSharedUnit(unwrap(checkSeriesCount(unwrap(parseDataset(input))))));
  const dataset = kind.check === undefined ? common : unwrap(kind.check(common));
  const empty = presentValues(dataset.series).length === 0;
  const built = empty ? undefined : kind.build(dataset, formatter);
  return {
    dataset,
    formatter,
    summary: kind.summarize(dataset, formatter),
    table: tableOf(dataset, formatter),
    model: built?.ok ? built.value : undefined,
    empty,
    renderError: built !== undefined && !built.ok ? built.error : undefined,
  };
}

const LINE: Kind<LineModel> = { build: buildLineModel, summarize };

export const prepareLine = (input: unknown, locale: string, name: string): Prepared<LineModel> =>
  prepare(input, locale, name, LINE);
