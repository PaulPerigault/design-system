// Garde-fou : aucun fichier source ne dépasse MAX_FILE_LINES lignes (on découpe, on ne relève pas).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { walk } from './walk.mjs';

export const MAX_FILE_LINES = 120;
const EXTENSIONS = ['.ts', '.astro', '.css', '.mjs'];
const ROOTS = ['packages', 'apps', 'tools'];

export const countLines = (text) =>
  text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;

/** @returns {{ file: string, lines: number }[]} fichiers trop longs */
export function findOversized(files, read = (file) => readFileSync(file, 'utf8')) {
  return files
    .map((file) => ({ file, lines: countLines(read(file)) }))
    .filter(({ lines }) => lines > MAX_FILE_LINES);
}

export function run(root = process.cwd()) {
  const files = ROOTS.map((dir) => join(root, dir))
    .filter((dir) => existsSync(dir))
    .flatMap((dir) => walk(dir, EXTENSIONS));
  return findOversized(files);
}

if (import.meta.main) {
  const problems = run();
  for (const { file, lines } of problems)
    console.error(`${file}: ${lines} lignes (max ${MAX_FILE_LINES})`);
  if (problems.length > 0) process.exit(1);
  console.log(`check-size: OK (max ${MAX_FILE_LINES} lignes)`);
}
