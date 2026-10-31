import type { Result } from '@paulperigault/dataviz';
import { fail, ok } from '@paulperigault/dataviz';
import { floats, missingMask } from './pack.ts';
import { run } from './runtime.ts';

const MAX_TARGET = 0xffff_ffff;
const isTarget = (target: number): boolean =>
  Number.isInteger(target) && target >= 0 && target <= MAX_TARGET;

/**
 * Indices croissants à garder (LTTB, Steinarsson 2013), mêmes règles que `lttb` de `dataviz`.
 * Une cible invalide ne passe pas au `.wasm` : il reçoit 0, qu'il refuse après les erreurs de forme,
 * comme la référence ; seule une série sans point accepte 0, et l'erreur est alors rendue ici.
 */
export function lttb(
  xs: readonly number[],
  values: readonly (number | null)[],
  target: number,
): Result<readonly number[]> {
  const valid = isTarget(target);
  const result = run('lttb', (raw) =>
    raw.lttb(Float64Array.from(xs), floats(values), missingMask(values), valid ? target : 0),
  );
  if (!result.ok) return result;
  if (!valid) {
    return fail('downsample.bad-target', `Cible ${target} : entier positif attendu.`, 'target');
  }
  return ok(Array.from(result.value));
}
