import type { AngleSpan, GaugeRange, GaugeShape, Result } from '@paulperigault/dataviz';
import { GAUGE_SPANS, fail, gaugeZones, ok, sectorPath } from '@paulperigault/dataviz';
import { GAUGE_LAYOUTS } from './gauge-layout.ts';

/** Teinte d'une zone : un renfort, jamais le sens (le libellé de la zone est toujours écrit). */
export type ZoneTone = 'good' | 'warning' | 'bad' | 'info';

/** Zone demandée : son libellé et sa borne haute (absente pour la dernière : le maximum). */
export interface ZoneSpec {
  readonly label: string;
  readonly to?: number;
  readonly tone?: ZoneTone;
}

export interface ZoneModel {
  readonly index: number;
  readonly name: string;
  readonly tone: ZoneTone | undefined;
  readonly from: number;
  readonly to: number;
  readonly span: AngleSpan;
  /** Secteur de la bande, pour le fond. */
  readonly d: string;
}

/** Seuils entre zones : la borne haute de chacune sauf la dernière, qui s'arrête au maximum. */
export function thresholdsOf(specs: readonly ZoneSpec[], max: number): Result<number[]> {
  const inner = specs.slice(0, -1);
  const missing = inner.findIndex((spec) => spec.to === undefined);
  if (missing >= 0) {
    return fail(
      'gauge.bad-thresholds',
      'Toute zone sauf la dernière porte sa borne `to`.',
      `zones[${missing}].to`,
    );
  }
  const last = specs[specs.length - 1]?.to;
  if (last !== undefined && last !== max) {
    return fail(
      'gauge.bad-thresholds',
      'La dernière zone s’arrête au maximum.',
      `zones[${specs.length - 1}].to`,
    );
  }
  return ok(inner.flatMap((spec) => spec.to ?? []));
}

/** Zones de la bande, contiguës, avec leur secteur ; `gauge.*` ou `geometry.*` si invalides. */
export function buildZones(
  specs: readonly ZoneSpec[],
  range: GaugeRange,
  shape: GaugeShape,
): Result<readonly ZoneModel[]> {
  const thresholds = thresholdsOf(specs, range[1]);
  if (!thresholds.ok) return thresholds;
  const zones = gaugeZones(thresholds.value, range, GAUGE_SPANS[shape]);
  if (!zones.ok) return zones;
  const { centre, radii } = GAUGE_LAYOUTS[shape];
  const built: ZoneModel[] = [];
  for (const zone of zones.value) {
    const d = sectorPath(centre, radii, zone.span);
    if (!d.ok) return d;
    const spec = specs[zone.index];
    built.push({ ...zone, name: spec?.label ?? '', tone: spec?.tone, d: d.value });
  }
  return ok(built);
}
