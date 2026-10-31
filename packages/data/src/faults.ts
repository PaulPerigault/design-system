import type { ErrorCode, Result } from '@paulperigault/dataviz';
import { fail } from '@paulperigault/dataviz';

export type Context = 'quantiles' | 'lttb' | 'aggregate';

/**
 * Chaînes levées par le `.wasm` (crates/pp-data-wasm/src/fault.rs) → code d'erreur de `dataviz`,
 * selon la fonction appelée : la même cause porte un code différent d'une fonction à l'autre,
 * comme dans la référence TypeScript.
 */
const CODES: Readonly<Record<Context, Readonly<Record<string, ErrorCode>>>> = {
  quantiles: {
    'empty-input': 'stats.empty',
    'non-finite-value': 'stats.non-finite',
    'bad-probability': 'stats.bad-probability',
    'too-many-points': 'dataset.too-many-points',
  },
  lttb: {
    'length-mismatch': 'geometry.bad-input',
    'non-finite-abscissa': 'geometry.bad-input',
    'non-finite-value': 'dataset.non-finite',
    'bad-target': 'downsample.bad-target',
    'too-many-points': 'dataset.too-many-points',
  },
  aggregate: {
    'empty-input': 'dataset.empty',
    'length-mismatch': 'dataset.length-mismatch',
    'non-finite-value': 'dataset.non-finite',
    'bad-date': 'dataset.bad-date',
    'too-many-points': 'dataset.too-many-points',
  },
};

/** Rend une valeur levée par le `.wasm` en erreur typée ; inconnue : `data.internal`. */
export function faultOf(context: Context, raised: unknown): Result<never> {
  const name = typeof raised === 'string' ? raised : undefined;
  const code = name === undefined ? undefined : CODES[context][name];
  const message = name === undefined ? 'Erreur inattendue du .wasm.' : `Refus du .wasm : ${name}.`;
  return fail(code ?? 'data.internal', message);
}
