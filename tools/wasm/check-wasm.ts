// Garde de publication : le `.wasm` est présent et son empreinte SHA-256 enregistrée correspond.
import { existsSync, readFileSync } from 'node:fs';
import { WASM_DIR, digestFailure } from './wasm-files.ts';

/** Vérifie `wasm/<file>` et `wasm/<file>.sha256` depuis le dossier du paquet ; sort 1 si KO. */
export function checkWasm(file: string): void {
  const wasm = `${WASM_DIR}/${file}`;
  const digest = `${wasm}.sha256`;
  const missing = [wasm, digest].filter((path) => !existsSync(path));
  if (missing.length > 0) {
    console.error(
      `check:wasm : ${missing.join(', ')} absent : lancer « npm run build:wasm » (CI).`,
    );
    process.exit(1);
  }
  const failure = digestFailure(readFileSync(wasm), readFileSync(digest, 'utf8'), file);
  if (failure) {
    console.error(`check:wasm : ${failure}`);
    process.exit(1);
  }
  console.log('check:wasm : OK');
}
