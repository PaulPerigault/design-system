// Mesure de duplication (jamais bloquante : sort toujours 0). Sources hors tests et générés.
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { measure } from './duplication.mjs';
import { walk } from './walk.mjs';

const ROOTS = ['packages', 'crates'];
const EXTENSIONS = ['.ts', '.mjs', '.rs'];
const EXCLUDED = /(^|[\\/])(wasm|target|generated|test|tests)[\\/]|\.test\.|\.d\.ts$/;

export const isMeasured = (path) => !EXCLUDED.test(path);

export function collect(root = process.cwd(), read = (f) => readFileSync(f, 'utf8')) {
  const files = ROOTS.map((dir) => join(root, dir))
    .filter((dir) => existsSync(dir))
    .flatMap((dir) => walk(dir, EXTENSIONS))
    .map((file) => relative(root, file))
    .filter(isMeasured);
  return new Map(files.map((file) => [file, read(join(root, file))]));
}

export function report({ total, duplicated, rate, blocks }) {
  const pct = (rate * 100).toFixed(2).replace('.', ',');
  const lines = [
    `check-duplication : ${pct} % (${duplicated} lignes sur ${total}), ${blocks.length} blocs`,
  ];
  for (const { file, from, to, lines: n } of blocks)
    lines.push(`  ${file}:${from}-${to} (${n} lignes)`);
  return lines.join('\n');
}

if (import.meta.main) {
  console.log(report(measure(collect())));
}
