import { lttb } from '../downsample/lttb.ts';
import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';
import type { Extremes } from './extremes.ts';

/** Un point par unité de la largeur de référence (120) : au-delà, le trait ne gagne rien. */
export const MAX_SPARKLINE_POINTS = 120;

/**
 * Indices à tracer : la série entière sous la limite, sinon LTTB à `MAX_SPARKLINE_POINTS`. Le
 * minimum et le maximum y sont toujours, pour que leurs marques tombent sur le tracé et que le texte
 * annonce les vrais extrêmes. `sparkline.too-many-gaps` si les trous dépassent le budget de points.
 */
export function keptIndices(
  xs: readonly number[],
  values: readonly (number | null)[],
  extremes: Extremes,
): Result<readonly number[]> {
  if (values.length <= MAX_SPARKLINE_POINTS) return ok(values.map((_, index) => index));
  const reduced = lttb(xs, values, MAX_SPARKLINE_POINTS);
  if (!reduced.ok) {
    return fail(
      'sparkline.too-many-gaps',
      `Trop de trous pour ${MAX_SPARKLINE_POINTS} points : comblez-les ou agrégez la série.`,
      'values',
    );
  }
  const all = new Set([...reduced.value, extremes.min.index, extremes.max.index]);
  return ok([...all].sort((a, b) => a - b));
}
