// Garde de publication : le `.wasm` est présent et son empreinte SHA-256 correspond.
import { checkWasm } from '../../../tools/wasm/check-wasm.ts';
import { WASM_FILE } from './wasm-files.ts';

checkWasm(WASM_FILE);
