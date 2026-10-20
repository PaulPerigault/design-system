// Contrôle : aucun fichier source ne dépasse `max` lignes (on découpe, on ne relève pas).
import { listFiles } from './lib/files.mjs';
import { GuardUsageError, report } from './lib/report.mjs';

export const name = 'size';

const MAX_LINES = 120;

export const defaults = {
  max: MAX_LINES,
  extensions: ['.ts', '.astro', '.css', '.mjs'],
  roots: ['src'],
};

export const cliOptions = {
  max: { type: 'string' },
  ext: { type: 'string', multiple: true },
};

/**
 * Même comptage que `tools/checks/check-size.mjs` : un saut de ligne final ne compte pas.
 * @param {string} text
 * @returns {number}
 */
export const countLines = (text) =>
  text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;

/**
 * @param {unknown} value nombre ou chaîne issue d'un drapeau
 * @returns {number}
 */
function parseMax(value) {
  const max = typeof value === 'string' ? Number(value.trim() === '' ? Number.NaN : value) : value;
  if (!Number.isInteger(max) || max <= 0) {
    throw new GuardUsageError(`--max doit être un entier positif (reçu : ${String(value)})`);
  }
  return max;
}

/** @param {string[] | undefined} list @param {string[]} fallback */
const nonEmpty = (list, fallback) => (list && list.length > 0 ? list : fallback);

/**
 * @param {{ max?: number | string, extensions?: string[], ext?: string[], roots?: string[] }} options
 * @param {import('./lib/io.mjs').GuardIo} io
 * @returns {0 | 1}
 */
export function run(options, io) {
  const max = parseMax(options.max ?? defaults.max);
  const extensions = nonEmpty(options.ext, nonEmpty(options.extensions, defaults.extensions));
  const roots = nonEmpty(options.roots, defaults.roots);
  const files = listFiles(io, roots, { extensions });
  const problems = files
    .map((file) => ({ file, lines: countLines(io.readText(file)) }))
    .filter(({ lines }) => lines > max)
    .map(({ file, lines }) => ({ file, message: `${lines} lignes (max ${max})` }));
  return report(io, { name, problems, checked: files.length });
}
