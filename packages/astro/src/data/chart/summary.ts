import type { Axis, Dataset, Formatter, Series } from '@paulperigault/dataviz';
import type { Found } from './found.ts';
import { extremes, missingNote, xLabel } from './found.ts';

const PERCENT = 100;
const TENTH = 10;
/** Dernière phrase de toute description de graphique : le tableau lié suit le SVG. */
export const TABLE_POINTER = 'Le tableau des données suit le graphique.';

/** « hausse de 12,5 % », « baisse de 3 % » ou « stable », à partir du premier et du dernier point. */
function trend(first: number, last: number, fmt: Formatter): string {
  if (first === last) return 'stable';
  if (first === 0) return last > first ? 'hausse' : 'baisse';
  const change = Math.round((Math.abs(last - first) / Math.abs(first)) * PERCENT * TENTH) / TENTH;
  return `${last > first ? 'hausse' : 'baisse'} de ${fmt.number(change, '%')}`;
}

/** Phrase factuelle sur une série : étendue, extrêmes, tendance chiffrée, données manquantes. */
export function summarizeSeries(series: Series, axis: Axis, fmt: Formatter): string {
  const found = extremes(series);
  const label = `Série « ${series.label} »`;
  if (found === null) return `${label} : aucune donnée.`;
  const at = (item: Found): string =>
    `${fmt.number(item.value, series.unit)} (${xLabel(axis, item.index, fmt)})`;
  const parts = [
    `de ${at(found.first)} à ${at(found.last)}, ${trend(found.first.value, found.last.value, fmt)}`,
    `minimum ${at(found.min)}`,
    `maximum ${at(found.max)}`,
  ];
  return `${label} : ${parts.join(' ; ')}.${missingNote(series)}`;
}

/** Résumé du graphique, lisible seul : une phrase par série (ordre du DOM : titre, résumé). */
export function summarize(dataset: Dataset, fmt: Formatter): string {
  return dataset.series.map((series) => summarizeSeries(series, dataset.x, fmt)).join(' ');
}

/** Alternative textuelle du SVG : résumé, axes, remarque sur l'origine, renvoi au tableau. */
export function describe(dataset: Dataset, summary: string, offZero: boolean): string {
  const unit = dataset.series[0]?.unit ?? '';
  const axes = `Axe horizontal : ${dataset.x.label}${unit === '' ? '' : `, axe vertical : ${unit}`}.`;
  const origin = offZero ? " L'axe vertical ne part pas de zéro." : '';
  return `${summary} ${axes}${origin} ${TABLE_POINTER}`;
}
