import type { Axis, Dataset, Formatter, Series } from '@paulperigault/dataviz';

const PERCENT = 100;
const TENTH = 10;

/** Libellé d'une abscisse : date en toutes lettres, nombre formaté ou catégorie telle quelle. */
export function xLabel(axis: Axis, index: number, fmt: Formatter): string {
  const value = axis.values[index];
  if (value === undefined) return '';
  if (typeof value === 'number') return fmt.number(value);
  return axis.kind === 'time' ? fmt.dateLabel(value) : value;
}

interface Found {
  readonly value: number;
  readonly index: number;
}

function extremes(series: Series): { first: Found; last: Found; min: Found; max: Found } | null {
  const present = series.values.flatMap((value, index): Found[] =>
    value === null ? [] : [{ value, index }],
  );
  const [first, last] = [present[0], present[present.length - 1]];
  if (first === undefined || last === undefined) return null;
  const pick = (better: (a: number, b: number) => boolean): Found =>
    present.reduce((best, item) => (better(item.value, best.value) ? item : best));
  return { first, last, min: pick((a, b) => a < b), max: pick((a, b) => a > b) };
}

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
  const missing = series.values.filter((value) => value === null).length;
  const gaps =
    missing === 0
      ? ''
      : ` ${missing} ${missing === 1 ? 'donnée manquante' : 'données manquantes'}.`;
  const parts = [
    `de ${at(found.first)} à ${at(found.last)}, ${trend(found.first.value, found.last.value, fmt)}`,
    `minimum ${at(found.min)}`,
    `maximum ${at(found.max)}`,
  ];
  return `${label} : ${parts.join(' ; ')}.${gaps}`;
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
  return `${summary} ${axes}${origin} Le tableau des données suit le graphique.`;
}
