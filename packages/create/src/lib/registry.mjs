import { posix } from 'node:path';
import { resolveIn } from './io.mjs';

export const PACKAGE_NAME = '@paulperigault/astro';
export const REPO_PREFIX = 'packages/astro/';
const ITEMS_DIR = 'registry/items';
const INSTALL_HINT = `npm i ${PACKAGE_NAME}`;

/**
 * @typedef {{ name: string, title?: string, files: { path: string, type?: string }[],
 *   meta?: Record<string, unknown> }} RegistryItem
 */

/**
 * Racine du paquet astro installé.
 * @param {import('./io.mjs').CreateIo} io
 * @param {string} [from]
 * @returns {string}
 */
export function packageRoot(io, from) {
  const root = resolveIn(io, from ?? `node_modules/${PACKAGE_NAME}`);
  if (!io.exists(posix.join(root, ITEMS_DIR))) {
    throw new Error(`${PACKAGE_NAME} introuvable dans ${root} : lancez ${INSTALL_HINT}`);
  }
  return root;
}

/**
 * @param {import('./io.mjs').CreateIo} io
 * @param {string} path
 * @returns {RegistryItem}
 */
function parseItem(io, path) {
  let data;
  try {
    data = JSON.parse(io.readText(path));
  } catch (cause) {
    throw new Error(`Fragment invalide (JSON) : ${path}`, { cause });
  }
  if (typeof data?.name !== 'string' || !Array.isArray(data.files)) {
    throw new Error(`Fragment invalide (name ou files manquant) : ${path}`);
  }
  if (!data.files.every((f) => typeof f?.path === 'string')) {
    throw new Error(`Fragment invalide (files[].path doit être une chaîne) : ${path}`);
  }
  return data;
}

/**
 * @param {import('./io.mjs').CreateIo} io
 * @param {string} root
 * @returns {RegistryItem[]}
 */
export function loadItems(io, root) {
  const dir = posix.join(root, ITEMS_DIR);
  return io
    .readdir(dir)
    .filter((entry) => !entry.isDirectory() && entry.name.endsWith('.json'))
    .map((entry) => parseItem(io, posix.join(dir, entry.name)))
    .sort((a, b) => (a.name < b.name ? -1 : Number(a.name > b.name)));
}

/**
 * @param {RegistryItem[]} items
 * @param {string} query
 * @returns {RegistryItem}
 */
export function findItem(items, query) {
  const wanted = query.trim().toLowerCase();
  const found = items.find(
    (item) => item.name.toLowerCase() === wanted || item.title?.toLowerCase() === wanted,
  );
  if (!found) {
    const names = items.map((item) => item.name).join(', ');
    throw new Error(`Élément « ${query} » introuvable. Disponibles : ${names}`);
  }
  return found;
}

/**
 * Chemins des fichiers d'un élément, relatifs à la racine du paquet.
 * @param {RegistryItem} item
 * @returns {string[]}
 */
export function itemFiles(item) {
  return item.files.map(({ path }) => {
    const rel = path.startsWith(REPO_PREFIX) ? path.slice(REPO_PREFIX.length) : path;
    const clean = posix.normalize(rel);
    const outside = posix.isAbsolute(clean) || clean === '..' || clean.startsWith('../');
    if (outside || clean === '.') {
      throw new Error(`Chemin hors du paquet dans « ${item.name} » : ${path}`);
    }
    return clean;
  });
}

/**
 * @param {import('./io.mjs').CreateIo} io
 * @param {string} root
 * @returns {string}
 */
export function packageVersion(io, root) {
  const path = posix.join(root, 'package.json');
  let manifest;
  try {
    manifest = JSON.parse(io.readText(path));
  } catch (cause) {
    throw new Error(`package.json illisible (JSON invalide) : ${path}`, { cause });
  }
  if (typeof manifest?.version !== 'string') {
    throw new Error(`package.json sans version (chaîne attendue) : ${path}`);
  }
  return manifest.version;
}
