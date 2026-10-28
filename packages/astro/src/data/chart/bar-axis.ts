import type { Formatter, LinearScale, Orientation, Result, Series } from '@paulperigault/dataviz';
import { linearScale, niceTicks, ok } from '@paulperigault/dataviz';
import type { AxesModel, AxisTick } from './axes.ts';
import type { Plot } from './bar-layout.ts';
import { LABEL_GAP, UNIT_RISE, X_LABEL_DROP, Y_TICKS, px } from './frame.ts';
import { presentValues } from './y-axis.ts';

export interface BarAxis {
  readonly scale: LinearScale;
  readonly axes: AxesModel;
}

/** Étendue de l'axe des valeurs : zéro y est toujours, une échelle de barres ne se tronque jamais. */
function valueExtent(series: readonly Series[]): [number, number] {
  const values = presentValues(series);
  const [low, high] = [Math.min(0, ...values), Math.max(0, ...values)];
  return low === high ? [0, 1] : [low, high];
}

function unitTick(unit: string, orientation: Orientation, plot: Plot): readonly AxisTick[] {
  if (unit === '') return [];
  const y = plot.top - UNIT_RISE;
  return orientation === 'vertical'
    ? [{ axis: 'unit', x: plot.left - LABEL_GAP, y, label: unit, align: 'end' }]
    : [{ axis: 'unit', x: plot.left, y, label: unit }];
}

/** Axe des valeurs (vertical pour des barres verticales), grille, base zéro et unité. */
export function buildBarAxis(
  series: readonly Series[],
  orientation: Orientation,
  plot: Plot,
  fmt: Formatter,
): Result<BarAxis> {
  const nice = niceTicks(...valueExtent(series), Y_TICKS);
  if (!nice.ok) return nice;
  const vertical = orientation === 'vertical';
  const range: [number, number] = vertical ? [plot.bottom, plot.top] : [plot.left, plot.right];
  const scale = linearScale(nice.value.domain, range);
  if (!scale.ok) return scale;
  const marks = nice.value.values.map((value) => ({
    at: px(scale.value.map(value)),
    label: fmt.number(value),
  }));
  const zero = px(scale.value.map(0));
  const ticks = marks.map(({ at, label }): AxisTick =>
    vertical
      ? { axis: 'y', x: plot.left - LABEL_GAP, y: at, label }
      : { axis: 'x', x: at, y: plot.bottom + X_LABEL_DROP, label },
  );
  const line = (at: number): string =>
    vertical ? `M${plot.left} ${at}H${plot.right}` : `M${at} ${plot.top}V${plot.bottom}`;
  return ok({
    scale: scale.value,
    axes: {
      grid: marks.map(({ at }) => line(at)).join(''),
      axis: line(zero),
      ticks: [...ticks, ...unitTick(series[0]?.unit ?? '', orientation, plot)],
    },
  });
}
