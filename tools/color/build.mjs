// Écrit `crates/pp-color/tests/vectors/parity.json` depuis la référence TypeScript, ou, avec
// `--check`, échoue si le fichier versionné est périmé (comme `check:mcp-data`). Les nombres sont
// comparés à 1e-12 près : `pow`, `cos` et `atan2` peuvent différer au dernier bit d'une machine à l'autre.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { buildVectors } from './vectors.mjs';

export const OUT = 'crates/pp-color/tests/vectors/parity.json';
const JSON_INDENT = 2;
const TOLERANCE = 1e-12;

/** Égalité profonde ; deux nombres sont égaux à `TOLERANCE` près (relative). */
export function same(a, b) {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= TOLERANCE * Math.max(1, Math.abs(a), Math.abs(b));
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return a === b;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => same(a[key], b[key]));
}

const isStale = (path, vectors) =>
  !existsSync(path) || !same(vectors, JSON.parse(readFileSync(path, 'utf8')));

async function write(path, vectors) {
  const options = (await resolveConfig(path)) ?? {};
  const json = JSON.stringify(vectors, null, JSON_INDENT);
  writeFileSync(path, await format(json, { ...options, filepath: path }));
}

export async function run(root = process.cwd(), { check = false } = {}) {
  const vectors = buildVectors((path) => readFileSync(join(root, path), 'utf8'));
  const path = join(root, OUT);
  if (check) {
    const stale = isStale(path, vectors);
    console.error(stale ? `${OUT} : à régénérer (npm run color:vectors)` : `${OUT} : à jour`);
    return stale ? 1 : 0;
  }
  await write(path, vectors);
  console.error(
    `${OUT} : ${vectors.colors.length} couleurs, ${vectors.contrasts.length} contrastes`,
  );
  return 0;
}

if (import.meta.main) {
  process.exitCode = await run(process.cwd(), { check: process.argv.includes('--check') });
}
