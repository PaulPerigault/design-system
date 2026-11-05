/** Lie à `/glossaire/` la première occurrence des termes techniques de chaque page de `dist/`. */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, posix, sep } from 'node:path';
import process from 'node:process';
import { linkTerms, term } from '../../../tools/typography/term-links.mjs';

/** Termes liés au glossaire : termes de développement, de contrôle et d'outils. */
export const TERMS = [
  term('apca', ['APCA']),
  term('ci', ['CI']),
  term('cli', ['CLI']),
  term('dto', ['DTO', 'DTOs']),
  term('e2e', ['e2e']),
  term('lttb', ['LTTB']),
  term('delta-e', ['ΔE', 'ΔE00']),
  term('build', ['build', 'builds']),
  term('props', ['props']),
  term('slot', ['slot', 'slots']),
  term('workflow', ['workflow', 'workflows']),
  // « axe » seul est aussi un mot français (axe vertical) : seul le nom du paquet est lié.
  term('axe-core', ['axe-core']),
  term('brotli', ['brotli']),
  term('gzip', ['gzip']),
  term('oidc', ['OIDC']),
  term('playwright', ['Playwright']),
  term('svg', ['SVG']),
  term('trusted-publishing', ['trusted publishing']),
];

const ARGV_START = 2;
const isPage = (rel) =>
  rel.endsWith('.html') && !rel.startsWith('pagefind/') && rel !== 'glossaire/index.html';

const fsIo = {
  list: (dir) => readdirSync(dir, { recursive: true }).map((p) => p.split(sep).join('/')),
  read: (path) => readFileSync(path, 'utf8'),
  write: (path, text) => writeFileSync(path, text),
};

/** @returns {number} pages réécrites */
export function run({ dist, read, write, list, out = process.stdout }) {
  const pages = list(dist).filter(isPage);
  let changed = 0;
  for (const rel of pages) {
    const path = posix.join(dist, rel);
    const html = read(path);
    const linked = linkTerms(html, TERMS);
    if (linked === html) continue;
    write(path, linked);
    changed += 1;
  }
  out.write(`termes liés : ${changed} pages sur ${pages.length}\n`);
  return changed;
}

if (import.meta.main) {
  const index = process.argv.indexOf('--dist');
  const dist =
    index >= ARGV_START ? process.argv[index + 1] : join(import.meta.dirname, '..', 'dist');
  run({ dist, ...fsIo });
}
