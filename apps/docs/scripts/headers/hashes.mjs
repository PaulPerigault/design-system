import { createHash } from 'node:crypto';

const STYLE_BLOCK = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
const SCRIPT_BLOCK = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const SRC_ATTRIBUTE = /\ssrc\s*=/i;
const JSON_LD_TYPE = /\stype\s*=\s*["']?application\/ld\+json/i;
const STYLE_ATTRIBUTE = /<[a-z][^>]*\sstyle\s*=/gi;

/**
 * Hachage CSP d'un contenu exact.
 * @param {string} content
 * @returns {string}
 */
function cspHash(content) {
  return `'sha256-${createHash('sha256').update(content, 'utf8').digest('base64')}'`;
}

/**
 * @param {string[]} contents
 * @returns {string[]}
 */
function uniqueSorted(contents) {
  return [...new Set(contents.map(cspHash))].sort();
}

/**
 * Hachages CSP des blocs `<style>` et `<script>` en ligne. Les scripts externes
 * et le JSON-LD (données, non exécutées) sont ignorés.
 * @param {string} html
 * @returns {{ styles: string[], scripts: string[] }}
 */
export function inlineHashes(html) {
  const styles = [...html.matchAll(STYLE_BLOCK)].map((match) => match[1]);
  const scripts = [...html.matchAll(SCRIPT_BLOCK)]
    .filter(([, attributes]) => !SRC_ATTRIBUTE.test(attributes))
    .filter(([, attributes]) => !JSON_LD_TYPE.test(attributes))
    .map((match) => match[2]);
  return { styles: uniqueSorted(styles), scripts: uniqueSorted(scripts) };
}

/**
 * Nombre d'attributs `style=""` (le test de build exige 0).
 * @param {string} html
 * @returns {number}
 */
export function inlineStyleAttributes(html) {
  return [...html.matchAll(STYLE_ATTRIBUTE)].length;
}
