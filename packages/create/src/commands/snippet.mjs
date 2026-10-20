import { posix } from 'node:path';
import { findItem, itemFiles, loadItems, packageRoot, packageVersion } from '../lib/registry.mjs';

/**
 * Ce que partagent `add` et `eject` : contrôle du positionnel, localisation de l'élément dans le
 * paquet installé et extrait d'import.
 */

export const CODE_OK = 0;
export const CODE_REFUSED = 1;
export const CODE_USAGE = 2;
const ASTRO_EXT = '.astro';

/**
 * @typedef {{ root: string, version: string, item: import('../lib/registry.mjs').RegistryItem,
 *   files: string[] }} Located
 */

/**
 * @param {unknown} error
 * @returns {string}
 */
export function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Élément demandé dans le paquet installé ; `null` (message sur `io.err`) si l'usage est faux ou
 * si le registre ne le fournit pas.
 * @param {import('../lib/io.mjs').CreateIo} io
 * @param {{ command: string, positionals?: string[], from?: string }} request
 * @returns {Located | null}
 */
export function locate(io, { command, positionals = [], from }) {
  if (positionals.length !== 1) {
    io.err(`usage : ${command} <élément>`);
    return null;
  }
  try {
    const root = packageRoot(io, from);
    const item = findItem(loadItems(io, root), positionals[0]);
    return { root, item, version: packageVersion(io, root), files: itemFiles(item) };
  } catch (error) {
    io.err(messageOf(error));
    return null;
  }
}

/**
 * @param {string[]} files
 * @returns {string[]} fichiers `.astro` seulement
 */
export function astroFiles(files) {
  return files.filter((file) => file.endsWith(ASTRO_EXT));
}

/**
 * `import Stack from '<specifier>';` pour le composant du fichier `path`.
 * @param {string} path
 * @param {string} specifier
 * @returns {string}
 */
export function importLine(path, specifier) {
  return `import ${posix.basename(path, ASTRO_EXT)} from '${specifier}';`;
}
