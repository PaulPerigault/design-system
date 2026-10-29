import { DECADE } from '../numbers.ts';
import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';

/** Borne de lisibilité (convention, non une preuve) : 9 chiffres entiers au plus dans une tuile. */
export const MAX_INTEGER_DIGITS = 9;

const LIMIT = DECADE ** MAX_INTEGER_DIGITS;

/**
 * `kpi.unreadable` si la partie entière dépasse la borne : au-delà, un chiffre ne se lit plus d'un
 * coup d'œil ; changer d'échelle (milliers, millions) et d'unité (k€, M€) en amont. Un nombre non
 * fini est refusé avec `kpi.bad-value`.
 */
export function checkReadable(value: number, path = 'value'): Result<number> {
  if (!Number.isFinite(value)) {
    return fail('kpi.bad-value', 'Valeur non finie : fournissez un nombre fini.', path);
  }
  if (Math.abs(value) < LIMIT) return ok(value);
  return fail(
    'kpi.unreadable',
    `Plus de ${MAX_INTEGER_DIGITS} chiffres entiers : changez d'échelle et d'unité (k€, M€).`,
    path,
  );
}
