import type { Dataset, Formatter } from '@paulperigault/dataviz';
import { MIN_STACK } from './area-model.ts';
import { summarize, summarizeSeries, describe } from './summary.ts';

/** Total cumulé par position : `null` seulement là où toutes les séries manquent. */
function totals(dataset: Dataset): (number | null)[] {
  return dataset.x.values.map((_, i) => {
    const present = dataset.series.flatMap((series) => series.values[i] ?? []);
    return present.length === 0 ? null : present.reduce((sum, value) => sum + value, 0);
  });
}

/** Une phrase par série, puis le total cumulé quand les aires sont empilées. */
export function summarizeArea(dataset: Dataset, fmt: Formatter): string {
  const lines = summarize(dataset, fmt);
  if (dataset.series.length < MIN_STACK) return lines;
  const unit = dataset.series[0]?.unit ?? '';
  const total = { id: 'total', label: 'Total empilé', unit, values: totals(dataset) };
  return `${lines} ${summarizeSeries(total, dataset.x, fmt)}`;
}

/** Alternative textuelle du SVG : résumé, axes, base zéro, ordre de l'empilement, tableau. */
export function describeArea(dataset: Dataset, summary: string, stacked: boolean): string {
  const gaps = dataset.series.some((series) => series.values.includes(null));
  const stack = stacked
    ? ` Les aires sont empilées dans l'ordre des séries.${gaps ? ' Une donnée manquante interrompt sa couche.' : ''}`
    : '';
  return describe(dataset, summary, false, ` L'axe vertical part de zéro.${stack}`);
}
