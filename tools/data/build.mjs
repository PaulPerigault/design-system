// Écrit `crates/pp-data/tests/vectors/parity.json` depuis la référence TypeScript, ou, avec
// `--check`, échoue si le fichier versionné est périmé (comme `check:color-vectors`).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { same } from '../color/build.mjs';
import { buildVectors } from './vectors.mjs';

export const OUT = 'crates/pp-data/tests/vectors/parity.json';
const JSON_INDENT = 2;

const isStale = (path, vectors) =>
  !existsSync(path) || !same(vectors, JSON.parse(readFileSync(path, 'utf8')));

async function write(path, vectors) {
  const options = (await resolveConfig(path)) ?? {};
  const json = JSON.stringify(vectors, null, JSON_INDENT);
  writeFileSync(path, await format(json, { ...options, filepath: path }));
}

export async function run(root = process.cwd(), { check = false } = {}) {
  // Comme le fichier : JSON écrit `null` pour NaN et Infinity.
  const vectors = JSON.parse(JSON.stringify(buildVectors()));
  const path = join(root, OUT);
  if (check) {
    const stale = isStale(path, vectors);
    console.error(stale ? `${OUT} : à régénérer (npm run data:vectors)` : `${OUT} : à jour`);
    return stale ? 1 : 0;
  }
  await write(path, vectors);
  console.error(`${OUT} : ${vectors.quantiles.length} quantiles, ${vectors.lttb.length} LTTB`);
  return 0;
}

if (import.meta.main) {
  process.exitCode = await run(process.cwd(), { check: process.argv.includes('--check') });
}
