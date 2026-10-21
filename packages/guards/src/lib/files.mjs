import { normalizePath } from './paths.mjs';

export const SKIPPED_DIRS = [
  'node_modules',
  'dist',
  '.astro',
  '.git',
  'coverage',
  'test-results',
  'playwright-report',
];

/** @param {string} dir @param {string} name */
const join = (dir, name) => (dir === '.' || dir === '' ? name : `${dir}/${name}`);

/** @param {string} path @param {string[]} extensions */
const hasExtension = (path, extensions) => {
  const lower = path.toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext.toLowerCase()));
};

/**
 * @param {import('./io.mjs').GuardIo} io
 * @param {string} dir
 * @param {{ extensions: string[], skip: readonly string[] }} options
 * @param {Set<string>} found
 */
function walk(io, dir, options, found) {
  for (const entry of io.readdir(dir)) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!options.skip.includes(entry.name)) walk(io, path, options, found);
    } else if (hasExtension(path, options.extensions)) {
      found.add(path);
    }
  }
}

/**
 * Fichiers des racines (récursif), triés, sans doublon.
 * @param {import('./io.mjs').GuardIo} io
 * @param {string[]} roots
 * @param {{ extensions: string[], skip?: readonly string[] }} options
 * @returns {string[]}
 */
export function listFiles(io, roots, { extensions, skip = SKIPPED_DIRS }) {
  const found = new Set();
  for (const raw of roots) {
    const root = normalizePath(raw);
    if (!io.exists(root)) continue;
    const children = tryReaddir(io, root);
    if (children === null) {
      if (hasExtension(root, extensions)) found.add(root);
    } else {
      walk(io, root, { extensions, skip }, found);
    }
  }
  return [...found].sort();
}

/**
 * @param {import('./io.mjs').GuardIo} io
 * @param {string} path
 */
function tryReaddir(io, path) {
  try {
    return io.readdir(path);
  } catch {
    return null;
  }
}

/**
 * Numéro de ligne (1 = première) d'un index de caractère.
 * @param {string} text
 * @param {number} index
 * @returns {number}
 */
export function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === '\n') line += 1;
  }
  return line;
}
