// Balisage d'image brut : `<img` et `background(-image): … url(` hors des chemins permis.
// `<Image`, `<Picture` et le `src: url()` d'une police ne sont pas visés. Les commentaires
// sont remplacés par des espaces, sauts de ligne conservés, avant la recherche.
import { lineOf } from '../lib/files.mjs';
import { matchesAny } from '../lib/paths.mjs';

const IMG_EXTENSIONS = ['.astro', '.html', '.md', '.mdx', '.jsx', '.tsx'];
const BACKGROUND_EXTENSIONS = ['.css', '.astro'];
export const MARKUP_EXTENSIONS = [...new Set([...IMG_EXTENSIONS, ...BACKGROUND_EXTENSIONS])];

const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const RAW_IMG = /<img(?=[\s/>])/gi;
const BACKGROUND_URL = /(?<![\w-])(background(?:-image)?)\s*:[^;{}]*?url\(/gi;

/** @param {string} file */
const extensionOf = (file) => file.slice(file.lastIndexOf('.')).toLowerCase();

/** @param {string} match */
const blank = (match) => match.replace(/[^\n]/g, ' ');

/**
 * Remplace les commentaires `/* *\/` et `<!-- -->` par des espaces, lignes conservées.
 * @param {string} text
 * @returns {string}
 */
export function neutralizeComments(text) {
  return text.replace(BLOCK_COMMENT, blank).replace(HTML_COMMENT, blank);
}

/**
 * Occurrences interdites d'un texte déjà neutralisé, par ordre d'apparition.
 * @param {string} text
 * @param {string} extension
 * @returns {{ index: number, label: string }[]}
 */
export function rawImages(text, extension) {
  const found = [];
  if (IMG_EXTENSIONS.includes(extension)) {
    for (const match of text.matchAll(RAW_IMG))
      found.push({ index: match.index, label: '<img> brut' });
  }
  if (BACKGROUND_EXTENSIONS.includes(extension)) {
    for (const match of text.matchAll(BACKGROUND_URL)) {
      found.push({ index: match.index, label: `${match[1].toLowerCase()}: url(` });
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

/**
 * @param {import('../lib/io.mjs').GuardIo} io
 * @param {string[]} files fichiers de balisage ou de style
 * @param {string[]} allow chemins où le balisage brut est permis
 * @returns {import('../lib/report.mjs').Problem[]}
 */
export function markupProblems(io, files, allow) {
  const outside = allow.length > 0 ? ` hors ${allow.join(', ')}` : '';
  return files
    .filter((file) => !matchesAny(file, allow))
    .flatMap((file) => {
      const extension = extensionOf(file);
      const text = neutralizeComments(io.readText(file));
      return rawImages(text, extension).map(({ index, label }) => ({
        file,
        line: lineOf(text, index),
        message: `${label} interdit${outside} : utiliser Photo`,
      }));
    });
}
