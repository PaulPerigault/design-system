/** Orthotypographie française du texte de chaque page de `dist/` (après `astro build`). */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, posix, sep } from 'node:path';
import process from 'node:process';
import { frenchTypography } from '../../../tools/typography/fr-typography.mjs';
import { mapText } from '../../../tools/typography/html-text.mjs';

const ARGV_START = 2;
const isPage = (rel) => rel.endsWith('.html') && !rel.startsWith('pagefind/');

const fsIo = {
  list: (dir) => readdirSync(dir, { recursive: true }).map((p) => p.split(sep).join('/')),
  read: (path) => readFileSync(path, 'utf8'),
  write: (path, text) => writeFileSync(path, text),
};

/**
 * @param {{ dist: string, read: (p: string) => string, write: (p: string, t: string) => void,
 *   list: (dir: string) => string[], out?: { write: (t: string) => unknown } }} io
 * @returns {number} pages réécrites
 */
export function run({ dist, read, write, list, out = process.stdout }) {
  const pages = list(dist).filter(isPage);
  let changed = 0;
  for (const rel of pages) {
    const path = posix.join(dist, rel);
    const html = read(path);
    const fixed = mapText(html, frenchTypography);
    if (fixed === html) continue;
    write(path, fixed);
    changed += 1;
  }
  out.write(`typographie : ${changed} pages sur ${pages.length}\n`);
  return changed;
}

const distArg = (argv) => {
  const index = argv.indexOf('--dist');
  return argv[index + 1] && index >= 0 ? argv[index + 1] : join(import.meta.dirname, '..', 'dist');
};

if (import.meta.main) run({ dist: distArg(process.argv.slice(ARGV_START)), ...fsIo });
