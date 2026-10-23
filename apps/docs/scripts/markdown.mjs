/** Écrit le jumeau Markdown de chaque page de `dist/` et `llms-full.txt` (après `astro build`). */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';
import { extractCanonical, extractTitle, htmlToMarkdown, ORIGIN } from './html-to-markdown.mjs';

const INDEX = 'index.html';
const ARGV_START = 2;
const SEPARATOR = '\n\n---\n\n';

const fsIo = {
  list: (dir) => readdirSync(dir, { recursive: true }).map((p) => p.split(sep).join('/')),
  read: (path) => readFileSync(path, 'utf8'),
  write: (path, text) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  },
};

const isPage = (rel) =>
  (rel === INDEX || rel.endsWith(`/${INDEX}`)) && !rel.startsWith('pagefind/');

/** `components/button/index.html` -> `/components/button/` */
export const pagePath = (rel) => `/${rel.slice(0, -INDEX.length)}`;

/** `components/button/index.html` -> `components/button.md` ; l'accueil -> `index.md` */
export const markdownName = (rel) => {
  const path = pagePath(rel).replace(/^\/|\/$/g, '');
  return `${path || 'index'}.md`;
};

function buildPage(rel, html) {
  const path = pagePath(rel);
  const title = extractTitle(html) || path;
  const url = extractCanonical(html) ?? new URL(path, ORIGIN).href;
  const body = htmlToMarkdown(html, { path });
  return {
    key: path === '/' ? '' : path,
    name: markdownName(rel),
    md: `# ${title}\n\nSource : ${url}\n\n${body}\n`,
  };
}

/**
 * @param {{ dist: string, read: (p: string) => string, write: (p: string, t: string) => void,
 *   list: (dir: string) => string[], out?: { write: (t: string) => unknown } }} io
 */
export function run({ dist, read, write, list, out = process.stdout }) {
  const pages = list(dist)
    .filter(isPage)
    .map((rel) => buildPage(rel, read(join(dist, rel))))
    .sort((a, b) => a.key.localeCompare(b.key, 'en'));
  for (const page of pages) write(join(dist, page.name), page.md);
  write(join(dist, 'llms-full.txt'), `${pages.map((p) => p.md.trimEnd()).join(SEPARATOR)}\n`);
  out.write(`markdown : ${pages.length} pages, llms-full.txt\n`);
  return pages.length;
}

const distArg = (argv) => {
  const index = argv.indexOf('--dist');
  return argv[index + 1] && index >= 0 ? argv[index + 1] : join(import.meta.dirname, '..', 'dist');
};

if (import.meta.main) run({ dist: distArg(process.argv.slice(ARGV_START)), ...fsIo });
