import type { Result } from '@paulperigault/dataviz';
import { ok } from '@paulperigault/dataviz';
import { run } from './runtime.ts';

/** Quantiles de type 7 (Hyndman et Fan, 1996) pour chaque probabilité ; voir `dataviz`. */
export function quantiles(
  values: readonly number[],
  probabilities: readonly number[],
): Result<readonly number[]> {
  const result = run('quantiles', (raw) =>
    raw.quantiles(Float64Array.from(values), Float64Array.from(probabilities)),
  );
  return result.ok ? ok(Array.from(result.value)) : result;
}

/** Un seul quantile de type 7. */
export function quantile(values: readonly number[], p: number): Result<number> {
  const result = quantiles(values, [p]);
  return result.ok ? ok(result.value[0] ?? Number.NaN) : result;
}
