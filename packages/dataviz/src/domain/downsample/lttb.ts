import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';
import { PAIR } from '../numbers.ts';
import type { Point } from './lttb-run.ts';
import { lttbRun } from './lttb-run.ts';

interface Run {
  readonly from: number;
  readonly to: number;
}

/** Suites de points non nuls : `to` exclu. */
function runsOf(values: readonly (number | null)[]): Run[] {
  const runs: Run[] = [];
  let from = -1;
  values.forEach((value, index) => {
    if (value !== null && from < 0) from = index;
    if (value === null && from >= 0) {
      runs.push({ from, to: index });
      from = -1;
    }
  });
  return from >= 0 ? [...runs, { from, to: values.length }] : runs;
}

const gapStarts = (values: readonly (number | null)[]): number[] =>
  values.flatMap((value, i) => (value === null && (i === 0 || values[i - 1] !== null) ? [i] : []));

/**
 * Sous-échantillonne une série à `target` points au plus par LTTB, sans inventer de valeur.
 * Retourne des indices croissants dans `xs`/`values` : premier et dernier point de chaque suite
 * conservés ; une valeur manquante (le premier `null` de chaque trou) reste pour que le tracé
 * se rompe au même endroit. Les suites se partagent le budget au prorata de leur longueur.
 * `downsample.bad-target` si la cible ne couvre pas 2 points par suite plus un par trou ;
 * `geometry.bad-input` si les longueurs diffèrent ou si une abscisse n'est pas finie.
 */
export function lttb(
  xs: readonly number[],
  values: readonly (number | null)[],
  target: number,
): Result<readonly number[]> {
  if (xs.length !== values.length || !xs.every(Number.isFinite)) {
    return fail('geometry.bad-input', 'xs et values : même longueur, abscisses finies.', 'xs');
  }
  const runs = runsOf(values);
  const gaps = gapStarts(values);
  const total = runs.reduce((sum, run) => sum + run.to - run.from, 0);
  if (!Number.isInteger(target) || target < runs.length * PAIR + gaps.length) {
    return fail(
      'downsample.bad-target',
      `Cible ${target} trop basse pour ${runs.length} suites.`,
      'target',
    );
  }
  const extra = target - gaps.length - runs.length * PAIR;
  const kept = runs.flatMap((run) => {
    const size = run.to - run.from;
    const quota = Math.min(size, PAIR + Math.floor((extra * size) / total));
    const points = xs.slice(run.from, run.to).flatMap((x, i): Point[] => {
      const y = values[run.from + i];
      return y === null || y === undefined ? [] : [{ x, y }];
    });
    return lttbRun(points, quota).map((index) => index + run.from);
  });
  return ok([...kept, ...gaps].sort((a, b) => a - b));
}
