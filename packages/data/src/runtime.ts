import type { Result } from '@paulperigault/dataviz';
import { fail, ok } from '@paulperigault/dataviz';
import type { Context } from './faults.ts';
import { faultOf } from './faults.ts';
import type { Glue, RawData } from './raw.ts';

// Produits par `npm run build:wasm` (wasm-bindgen), à côté de `src/` et de `dist/`.
const GLUE = new URL('../wasm/pp_data_wasm.js', import.meta.url);
const WASM = new URL('../wasm/pp_data_wasm_bg.wasm', import.meta.url);

let loaded: RawData | undefined;
let loading: Promise<Result<void>> | undefined;

/**
 * Node : lecture et instanciation synchrones (l'instanciation asynchrone y coûte plus cher, mesuré
 * par `npm run measure`). Ailleurs, wasm-bindgen charge le fichier par `fetch`.
 */
async function start(glue: Glue): Promise<void> {
  const fs = globalThis.process?.getBuiltinModule?.('node:fs');
  if (WASM.protocol === 'file:' && fs) glue.initSync({ module: fs.readFileSync(WASM) });
  else await glue.default({ module_or_path: WASM });
}

async function load(): Promise<Result<void>> {
  try {
    const glue: Glue = await import(/* @vite-ignore */ GLUE.href);
    await start(glue);
    loaded = glue;
    return ok(undefined);
  } catch (cause) {
    loading = undefined;
    return fail('data.load-failed', `Chargement du .wasm impossible : ${String(cause)}`);
  }
}

/** Charge et instancie le `.wasm` une seule fois ; à attendre avant tout appel. Ne lève jamais. */
export function init(): Promise<Result<void>> {
  loading ??= load();
  return loading;
}

/** Vrai quand `init()` a abouti. */
export const isReady = (): boolean => loaded !== undefined;

/** Appelle le `.wasm` ; tout refus devient une erreur typée, jamais un texte brut ni un throw. */
export function run<T>(context: Context, call: (raw: RawData) => T): Result<T> {
  if (!loaded) return fail('data.not-ready', "init() n'a pas été attendu.");
  try {
    return ok(call(loaded));
  } catch (raised) {
    return faultOf(context, raised);
  }
}
