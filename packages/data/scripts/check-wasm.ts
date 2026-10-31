// Garde de publication : le `.wasm` est présent et son empreinte SHA-256 enregistrée correspond.
import { existsSync, readFileSync } from 'node:fs';
import { DIGEST_FILE, WASM_DIR, WASM_FILE, digestFailure } from './wasm-files.ts';

const wasm = `${WASM_DIR}/${WASM_FILE}`;
const digest = `${WASM_DIR}/${DIGEST_FILE}`;
const missing = [wasm, digest].filter((file) => !existsSync(file));
if (missing.length > 0) {
  console.error(`check:wasm : ${missing.join(', ')} absent : lancer « npm run build:wasm » (CI).`);
  process.exit(1);
}
const failure = digestFailure(readFileSync(wasm), readFileSync(digest, 'utf8'));
if (failure) {
  console.error(`check:wasm : ${failure}`);
  process.exit(1);
}
console.log('check:wasm : OK');
