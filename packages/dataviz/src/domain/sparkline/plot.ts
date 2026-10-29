import type { Result } from '../result.ts';
import { ok } from '../result.ts';
import { round1 } from '../geometry/relative-curve.ts';
import type { LinearScale } from '../scale/linear.ts';
import { linearScale } from '../scale/linear.ts';
import type { Variation } from '../kpi/variation.ts';
import { variation } from '../kpi/variation.ts';
import type { Extremum } from './extremes.ts';
import type { Marker } from './sparkline.ts';
import type { CheckedSparkline } from './validate.ts';

export interface Scales {
  readonly x: LinearScale;
  readonly y: LinearScale;
}

export function scalesOf(
  xs: readonly number[],
  low: number,
  high: number,
  box: {
    readonly width: number;
    readonly height: number;
    readonly padding: number;
  },
): Result<Scales> {
  const first = xs[0] ?? 0;
  const last = xs[xs.length - 1] ?? first;
  const x = linearScale([first, last], [box.padding, box.width - box.padding]);
  if (!x.ok) return x;
  const y = linearScale([low, high], [box.height - box.padding, box.padding]);
  return y.ok ? ok({ x: x.value, y: y.value }) : y;
}

export const markerOf = (extremum: Extremum, xs: readonly number[], scales: Scales): Marker => ({
  ...extremum,
  x: round1(scales.x.map(xs[extremum.index] ?? 0)),
  y: round1(scales.y.map(extremum.value)),
});

const firstIndexOf = (values: readonly (number | null)[]): number =>
  values.findIndex((value) => value !== null);

export function lastPoint(values: readonly (number | null)[]): Extremum {
  const index = values.findLastIndex((value) => value !== null);
  return { index, value: values[index] ?? 0 };
}

/** Du premier au dernier point non nul ; `null` avec un seul point. */
export function trendOf(values: readonly (number | null)[], end: Extremum): Variation | null {
  const start = firstIndexOf(values);
  if (start === end.index) return null;
  const result = variation(end.value, values[start] ?? end.value);
  return result.ok ? result.value : null;
}

export function plotPoints(checked: CheckedSparkline, scales: Scales, indices: readonly number[]) {
  return indices.map((index) => {
    const value = checked.values[index];
    const x = scales.x.map(checked.xs[index] ?? 0);
    return { x, y: value === null || value === undefined ? null : scales.y.map(value) };
  });
}
