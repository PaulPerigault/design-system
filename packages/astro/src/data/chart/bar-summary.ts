import type { Axis, Dataset, Formatter, Orientation, Series } from '@paulperigault/dataviz';
import type { Found } from './found.ts';
import { extremes, missingNote, xLabel } from './found.ts';
import { TABLE_POINTER } from './summary.ts';

/** Phrase factuelle sur une série de barres : maximum, minimum, données manquantes. */
function summarizeBars(series: Series, axis: Axis, fmt: Formatter): string {
  const found = extremes(series);
  const label = `Série « ${series.label} »`;
  if (found === null) return `${label} : aucune donnée.`;
  const at = (item: Found): string =>
    `${fmt.number(item.value, series.unit)} (${xLabel(axis, item.index, fmt)})`;
  return `${label} : maximum ${at(found.max)} ; minimum ${at(found.min)}.${missingNote(series)}`;
}

/** Résumé du graphique, lisible seul : une phrase par série. */
export const summarizeBarChart = (dataset: Dataset, fmt: Formatter): string =>
  dataset.series.map((series) => summarizeBars(series, dataset.x, fmt)).join(' ');

/** Alternative textuelle du SVG : résumé, axes, base zéro, renvoi au tableau. */
export function describeBars(dataset: Dataset, summary: string, orientation: Orientation): string {
  const unit = dataset.series[0]?.unit ?? '';
  const values = unit === '' ? 'valeurs' : unit;
  const [horizontal, vertical] =
    orientation === 'vertical' ? [dataset.x.label, values] : [values, dataset.x.label];
  const axes = `Axe horizontal : ${horizontal}, axe vertical : ${vertical}.`;
  return `${summary} ${axes} L'axe des valeurs part de zéro. ${TABLE_POINTER}`;
}
