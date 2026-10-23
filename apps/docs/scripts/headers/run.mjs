/** Orchestration : lit `dist/*.html`, calcule la politique, écrit les fichiers d'hébergement. */
import { join } from 'node:path';
import { renderHeaders, renderRedirects } from './cloudflare.mjs';
import { inlineHashes, inlineStyleAttributes } from './hashes.mjs';
import { render as netlify } from './netlify.mjs';
import { render as nginx } from './nginx.mjs';
import { REDIRECTS, REQUIRED_HEADERS, buildRules } from './policy.mjs';
import { render as vercel } from './vercel.mjs';

const JSON_INDENT = 2;

/** @param {string} rel */
const isHtml = (rel) => rel.endsWith('.html');

/**
 * Union triée des hachages ; refuse tout attribut `style=""` (ignoré par la CSP stricte).
 * @param {string} dist
 * @param {{ list: (dir: string) => string[], read: (p: string) => string }} io
 * @returns {{ styleHashes: string[], scriptHashes: string[] }}
 */
export function collectHashes(dist, { list, read }) {
  const styles = new Set();
  const scripts = new Set();
  for (const rel of list(dist).filter(isHtml)) {
    const html = read(join(dist, rel));
    if (inlineStyleAttributes(html) > 0) {
      throw new Error(`${rel} : attribut style="" interdit (la CSP stricte l'ignore)`);
    }
    const found = inlineHashes(html);
    found.styles.forEach((hash) => styles.add(hash));
    found.scripts.forEach((hash) => scripts.add(hash));
  }
  return { styleHashes: [...styles].sort(), scriptHashes: [...scripts].sort() };
}

/**
 * Relit les sorties qui portent des en-têtes et vérifie chaque nom de `REQUIRED_HEADERS`.
 * @param {string[]} paths
 * @param {(p: string) => string} read
 */
export function assertRequiredHeaders(paths, read) {
  for (const path of paths) {
    const text = read(path);
    const missing = REQUIRED_HEADERS.filter((name) => !text.includes(name));
    if (missing.length > 0) {
      throw new Error(`${path} : en-tête(s) manquant(s) : ${missing.join(', ')}`);
    }
  }
}

/**
 * @param {{ dist: string, deploy?: string, list: (dir: string) => string[],
 *   read: (p: string) => string, write: (p: string, t: string) => void,
 *   out?: { write: (t: string) => unknown } }} io
 * @returns {string[]} fichiers écrits
 */
export function run({ dist, deploy = join(dist, '..', 'deploy'), list, read, write, out }) {
  const rules = buildRules(collectHashes(dist, { list, read }));
  const withHeaders = [
    [join(dist, '_headers'), renderHeaders(rules)],
    [join(deploy, 'netlify.toml'), netlify(rules, REDIRECTS)],
    [
      join(deploy, 'vercel.json'),
      `${JSON.stringify(vercel(rules, REDIRECTS), null, JSON_INDENT)}\n`,
    ],
    [join(deploy, 'nginx.conf'), nginx(rules, REDIRECTS)],
  ];
  const redirects = [join(dist, '_redirects'), renderRedirects(REDIRECTS)];
  const files = [...withHeaders, redirects];
  for (const [path, text] of files) write(path, text);
  assertRequiredHeaders(
    withHeaders.map(([path]) => path),
    read,
  );
  const written = files.map(([path]) => path);
  out?.write(`en-têtes : ${written.length} fichiers (${written.join(', ')})\n`);
  return written;
}
