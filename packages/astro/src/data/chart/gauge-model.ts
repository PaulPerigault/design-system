import type { GaugeRange, GaugeReading, GaugeShape, Result } from '@paulperigault/dataviz';
import { GAUGE_SPANS, fail, gaugeReading, ok, radialLine, zoneIndex } from '@paulperigault/dataviz';
import { fitLabel } from './labels.ts';
import { GAUGE_LAYOUTS, NEEDLE_OVERSHOOT } from './gauge-layout.ts';
import type { GaugeContext } from './gauge-text.ts';
import { clampNote } from './gauge-text.ts';
import type { ZoneModel, ZoneSpec } from './gauge-zones.ts';
import { buildZones } from './gauge-zones.ts';

export interface GaugeInput {
  readonly value: number | null;
  readonly range: GaugeRange;
  readonly label: string;
  readonly shape: GaugeShape;
  readonly zones: readonly ZoneSpec[];
}

/** Texte posé dans le SVG : `kind` donne la classe `pp-gauge-chart__<kind>`. */
export interface GaugeLine {
  readonly kind: 'current' | 'note' | 'label' | 'min' | 'max';
  readonly x: number;
  readonly y: number;
  readonly text: string;
}

export interface GaugeModel {
  readonly viewBox: string;
  readonly zones: readonly ZoneModel[];
  /** Aiguille : un trait radial à l'angle de la valeur bornée. */
  readonly needle: string;
  readonly value: { readonly x: number; readonly y: number; readonly number: string };
  readonly lines: readonly GaugeLine[];
  readonly reading: GaugeReading;
  readonly current: ZoneModel | undefined;
}

/** Textes autour de la valeur : zone actuelle, bornage, libellé et bornes de l'intervalle. */
function linesOf(input: GaugeInput, ctx: GaugeContext, reading: GaugeReading, current?: ZoneModel) {
  const layout = GAUGE_LAYOUTS[input.shape];
  const { fmt, unit, labels } = ctx;
  const [min, max] = input.range;
  const candidates: GaugeLine[] = [
    { kind: 'current', ...layout.zone, text: current?.name ?? '' },
    { kind: 'note', ...layout.note, text: clampNote(reading, labels) },
    {
      kind: 'label',
      ...layout.label,
      text: fitLabel(input.label, layout.labelChars, 1).lines[0] ?? '',
    },
    ...(layout.ends
      ? [
          { kind: 'min', ...layout.ends.min, text: fmt.number(min, unit) } as const,
          { kind: 'max', ...layout.ends.max, text: fmt.number(max, unit) } as const,
        ]
      : []),
  ];
  return candidates.filter((line) => line.text !== '');
}

/**
 * Géométrie de la jauge pour une valeur : bande de zones, aiguille, textes. `gauge.*` si
 * l'intervalle ou les seuils sont invalides, `geometry.bad-input` si la valeur n'est pas finie.
 */
export function buildGaugeModel(
  input: GaugeInput & { readonly value: number },
  ctx: GaugeContext,
): Result<GaugeModel> {
  const zones = buildZones(input.zones, input.range, input.shape);
  if (!zones.ok) return zones;
  const layout = GAUGE_LAYOUTS[input.shape];
  const reading = gaugeReading(input.value, input.range, GAUGE_SPANS[input.shape]);
  if (!reading.ok) return reading;
  const { inner, outer } = layout.radii;
  const needle = radialLine(
    layout.centre,
    { inner: inner - NEEDLE_OVERSHOOT, outer: outer + NEEDLE_OVERSHOOT },
    reading.value.angle,
  );
  if (!needle.ok) return needle;
  const current = zones.value[zoneIndex(zones.value, reading.value.value)];
  const number = ctx.fmt.number(input.value);
  if (number === '') return fail('geometry.bad-input', 'Valeur illisible.', 'value');
  return ok({
    viewBox: layout.viewBox,
    zones: zones.value,
    needle: needle.value,
    value: { ...layout.value, number },
    lines: linesOf(input, ctx, reading.value, current),
    reading: reading.value,
    current,
  });
}
