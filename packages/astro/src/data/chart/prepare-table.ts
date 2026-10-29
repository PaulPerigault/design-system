import type { Dataset, Formatter } from '@paulperigault/dataviz';
import { checkSeriesCount, createFormatter, parseDataset } from '@paulperigault/dataviz';
import { unwrap } from './errors.ts';

export interface PreparedTable {
  readonly dataset: Dataset;
  readonly formatter: Formatter;
}

/** Valide à la frontière (`dataset.*`, `chart.too-many-series`, `format.bad-locale`). */
export function prepareTable(input: unknown, locale: string, name: string): PreparedTable {
  const formatter = unwrap(name, createFormatter(locale));
  const dataset = unwrap(name, checkSeriesCount(unwrap(name, parseDataset(input))));
  return { dataset, formatter };
}
