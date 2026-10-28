import type { Formatter, Result, Series } from '@paulperigault/dataviz';
import { linearScale, niceTicks, ok } from '@paulperigault/dataviz';
import { PLOT, Y_TICKS, px } from './frame.ts';

export interface YAxis {
  readonly map: (value: number) => number;
  readonly ticks: readonly { readonly y: number; readonly label: string }[];
  /** Vrai si le domaine exclut zéro : à dire dans la description. */
  readonly offZero: boolean;
}

/** Valeurs présentes de toutes les séries (`null` écartés). */
export const presentValues = (series: readonly Series[]): number[] =>
  series.flatMap((s) => s.values.filter((v): v is number => v !== null));

/** Axe vertical : graduations rondes (Heckbert, 1990) sur l'étendue des valeurs présentes. */
export function buildYAxis(values: readonly number[], fmt: Formatter): Result<YAxis> {
  const nice = niceTicks(Math.min(...values), Math.max(...values), Y_TICKS);
  if (!nice.ok) return nice;
  const scale = linearScale(nice.value.domain, [PLOT.bottom, PLOT.top]);
  if (!scale.ok) return scale;
  const [low, high] = nice.value.domain;
  return ok({
    map: scale.value.map,
    ticks: nice.value.values.map((v) => ({ y: px(scale.value.map(v)), label: fmt.number(v) })),
    offZero: low > 0 || high < 0,
  });
}
