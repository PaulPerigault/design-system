// Noms de fichiers du `.wasm` de color ; le calcul d'empreinte et de poids est partagé.
import {
  digestFailure as failure,
  digestLine as line,
  weightLine as weight,
} from '../../../tools/wasm/wasm-files.ts';
import type { Weight } from '../../../tools/wasm/wasm-files.ts';

export { WASM_DIR, sha256, weigh } from '../../../tools/wasm/wasm-files.ts';
export const WASM_FILE = 'pp_color_wasm_bg.wasm';
export const DIGEST_FILE = `${WASM_FILE}.sha256`;

export const digestLine = (bytes: Uint8Array): string => line(bytes, WASM_FILE);
export const digestFailure = (bytes: Uint8Array, recorded: string): string | null =>
  failure(bytes, recorded, WASM_FILE);
export const weightLine = (value: Weight): string => weight(value, WASM_FILE);
