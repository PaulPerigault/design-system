import type { Formatter, GaugeRange, GaugeReading } from '@paulperigault/dataviz';
import type { ZoneModel } from './gauge-zones.ts';
import { TABLE_POINTER } from './summary.ts';
import type { TableModel } from './table.ts';

/** Textes de la jauge, en français par défaut (le composant ne contient aucun autre texte). */
export interface GaugeLabels {
  readonly zone: string;
  readonly from: string;
  readonly to: string;
  readonly current: string;
  readonly range: string;
  readonly below: string;
  readonly above: string;
}

export const GAUGE_LABELS: GaugeLabels = {
  zone: 'Zone',
  from: 'De',
  to: 'À',
  current: 'Valeur actuelle',
  range: 'Intervalle',
  below: 'sous le minimum',
  above: 'au-dessus du maximum',
};

/** Mise en forme commune : formateur, unité et libellés. */
export interface GaugeContext {
  readonly fmt: Formatter;
  readonly unit: string;
  readonly labels: GaugeLabels;
}

/** Ce que les textes disent d'une jauge qui a une valeur : mesure, bornage, zone actuelle. */
export interface GaugeReadout {
  readonly range: GaugeRange;
  readonly zones: readonly ZoneModel[];
  readonly value: number;
  readonly reading: GaugeReading;
  readonly current: ZoneModel | undefined;
}

const between = (from: number, to: number, { fmt, unit }: GaugeContext): string =>
  `de ${fmt.number(from, unit)} à ${fmt.number(to, unit)}`;

/** « Élevée : de 80 % à 100 % » (la seule plage quand la zone n'a pas de nom). */
export const zoneText = (zone: ZoneModel, ctx: GaugeContext): string =>
  [zone.name, between(zone.from, zone.to, ctx)].filter((part) => part !== '').join(' : ');

/** Indication de bornage, vide si la valeur est dans l'intervalle. */
export function clampNote(reading: GaugeReading, labels: GaugeLabels): string {
  if (reading.clamped === null) return '';
  return reading.clamped === 'below' ? labels.below : labels.above;
}

/** Alternative textuelle du SVG : valeur, intervalle, zone, bornage, zones, renvoi au tableau. */
export function describeGauge(label: string, ctx: GaugeContext, readout: GaugeReadout): string {
  const { fmt, unit, labels } = ctx;
  const { range, zones, value, reading, current } = readout;
  const [min, max] = range;
  const zone = current?.name ? `, zone « ${current.name} »` : '';
  const note = clampNote(reading, labels);
  const clamped =
    note === '' ? '' : ` Valeur ${note}, représentée à ${fmt.number(reading.value, unit)}.`;
  const list =
    zones.length > 1 ? ` Zones : ${zones.map((z) => zoneText(z, ctx)).join(' ; ')}.` : '';
  const subject = label === '' ? 'Jauge' : `Jauge « ${label} »`;
  const scale = `sur un intervalle ${between(min, max, ctx)}`;
  return `${subject} : ${fmt.number(value, unit)} ${scale}${zone}.${clamped}${list} ${TABLE_POINTER}`;
}

/** Tableau lié : une ligne par zone, la valeur actuelle sur la zone qui la contient. */
export function gaugeTable(
  zones: readonly ZoneModel[],
  ctx: GaugeContext,
  readout: Pick<GaugeReadout, 'value' | 'current'> | undefined,
): TableModel {
  const { fmt, unit, labels } = ctx;
  return {
    columns: [
      { key: 'x', label: labels.zone },
      { key: 'from', label: labels.from, numeric: true },
      { key: 'to', label: labels.to, numeric: true },
      { key: 'now', label: labels.current, numeric: true },
    ],
    rows: zones.map((zone) => ({
      x: zone.name === '' ? labels.range : zone.name,
      from: fmt.number(zone.from, unit),
      to: fmt.number(zone.to, unit),
      now: readout?.current === zone ? fmt.number(readout.value, unit) : '',
    })),
  };
}
