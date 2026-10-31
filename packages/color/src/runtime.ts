import { ColorError, parseFault } from './error.ts';
import type { Glue, RawColor } from './raw.ts';

// Produits par `npm run build:wasm` (wasm-bindgen), à côté de `src/` et de `dist/`.
const GLUE = new URL('../wasm/pp_color_wasm.js', import.meta.url);
const WASM = new URL('../wasm/pp_color_wasm_bg.wasm', import.meta.url);

let loaded: RawColor | undefined;
let loading: Promise<void> | undefined;

/**
 * Node : lecture et instanciation synchrones (l'instanciation asynchrone y coûte environ 20 ms de
 * plus, mesuré par `npm run measure`). Ailleurs, wasm-bindgen charge le fichier par `fetch`.
 */
async function start(glue: Glue): Promise<void> {
  const fs = globalThis.process?.getBuiltinModule?.('node:fs');
  if (WASM.protocol === 'file:' && fs) glue.initSync({ module: fs.readFileSync(WASM) });
  else await glue.default({ module_or_path: WASM });
}

async function load(): Promise<void> {
  try {
    const glue: Glue = await import(/* @vite-ignore */ GLUE.href);
    await start(glue);
    loaded = glue;
  } catch (cause) {
    loading = undefined;
    throw new ColorError('load-failed', undefined, { cause });
  }
}

/** Charge et instancie le `.wasm` une seule fois ; à attendre avant tout appel de couleur. */
export function init(): Promise<void> {
  loading ??= load();
  return loading;
}

/** Vrai quand `init()` a abouti. */
export const isReady = (): boolean => loaded !== undefined;

/** Appelle le `.wasm` ; toute valeur levée devient une `ColorError`, jamais un texte brut. */
export function run<T>(call: (raw: RawColor) => T): T {
  if (!loaded) throw new ColorError('not-ready');
  try {
    return call(loaded);
  } catch (raised) {
    throw parseFault(raised);
  }
}
