import type { Dataset, Formatter } from '@paulperigault/dataviz';
import { xLabel } from './found.ts';

export interface TableModel {
  columns: { key: string; label: string; numeric?: boolean }[];
  rows: Record<string, string>[];
}

/** Tableau de données complet : une colonne par série, « donnée manquante » dite, jamais omise. */
export function tableOf(dataset: Dataset, fmt: Formatter): TableModel {
  const columns = [
    { key: 'x', label: dataset.x.label },
    ...dataset.series.map((s, index) => ({
      key: `s${index}`,
      label: s.unit === '' ? s.label : `${s.label} (${s.unit})`,
      numeric: true,
    })),
  ];
  const rows = dataset.x.values.map((_, index) => ({
    x: xLabel(dataset.x, index, fmt),
    ...Object.fromEntries(
      dataset.series.map((s, column) => {
        const value = s.values[index];
        return [
          `s${column}`,
          value === null || value === undefined ? fmt.missing : fmt.number(value),
        ];
      }),
    ),
  }));
  return { columns, rows };
}
