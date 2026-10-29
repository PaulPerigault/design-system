import type { Axis, Formatter, Marker, Series } from '@paulperigault/dataviz';
import { xLabel } from './found.ts';
import { markerPath } from './markers.ts';
import { SWATCH } from './frame.ts';
import type { MarkKind, SparkModel } from './sparkline-model.ts';
import { SHAPE } from './sparkline-model.ts';
import { summarizeSeries, TABLE_POINTER } from './summary.ts';
import type { Swatch } from './swatch.ts';

/** Textes de la sparkline, en français par défaut (le composant ne contient aucun autre texte). */
export interface SparkLabels {
  readonly end: string;
  readonly max: string;
  readonly min: string;
  readonly trailingGap: string;
}

export const SPARK_LABELS: SparkLabels = {
  end: 'Dernière valeur',
  max: 'Plus haut',
  min: 'Plus bas',
  trailingGap: 'La série se termine par une donnée manquante.',
};

interface Reading {
  readonly series: Series;
  readonly axis: Axis;
  readonly fmt: Formatter;
  readonly labels: SparkLabels;
}

const LEGEND_KINDS = ['end', 'max', 'min'] as const satisfies readonly MarkKind[];

/** « 340 visites (décembre 2026) » : la valeur et l'abscisse où elle se lit. */
const at = (marker: Marker, { series, axis, fmt }: Reading): string =>
  `${fmt.number(marker.value, series.unit)} (${xLabel(axis, marker.index, fmt)})`;

/** Légende écrite : un repère et la valeur qu'il désigne, jamais la forme seule. */
export function sparkSwatches(model: SparkModel, reading: Reading): Swatch[] {
  const { geometry } = model;
  return LEGEND_KINDS.map((kind) => ({
    index: 0,
    label: `${reading.labels[kind]} : ${at(geometry[kind], reading)}`,
    marks: [{ kind, d: markerPath(SHAPE[kind], SWATCH.midX, SWATCH.midY) }],
  }));
}

/** Alternative textuelle du SVG : résumé chiffré de la série, fin sur trou, renvoi au tableau. */
export function describeSpark(title: string, model: SparkModel, reading: Reading): string {
  const { series, axis, fmt, labels } = reading;
  const gap = model.geometry.trailingGap ? ` ${labels.trailingGap}` : '';
  return `Sparkline « ${title} » : ${summarizeSeries(series, axis, fmt)}${gap} ${TABLE_POINTER}`;
}
