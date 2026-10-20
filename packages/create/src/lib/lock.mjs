import { resolveIn } from './io.mjs';

export const LOCK_FILE = 'pp-ds.lock.json';
const LOCK_VERSION = 1;
const INDENT = 2;

/**
 * @typedef {{ source: string, path: string, sha256: string }} LockFile
 * @typedef {{ package: string, version: string, files: LockFile[] }} LockEntry
 * @typedef {{ lockfileVersion: number, items: Record<string, LockEntry> }} Lock
 */

/** @returns {Lock} */
function emptyLock() {
  return { lockfileVersion: LOCK_VERSION, items: {} };
}

/**
 * Lit le verrou ; absent → verrou vide.
 * @param {import('./io.mjs').CreateIo} io
 * @returns {Lock}
 */
export function readLock(io) {
  const path = resolveIn(io, LOCK_FILE);
  if (!io.exists(path)) return emptyLock();
  let data;
  try {
    data = JSON.parse(io.readText(path));
  } catch (cause) {
    throw new Error(`${LOCK_FILE} illisible (JSON invalide)`, { cause });
  }
  if (data?.lockfileVersion !== LOCK_VERSION) {
    throw new Error(`${LOCK_FILE} : lockfileVersion ${data?.lockfileVersion} non pris en charge`);
  }
  return { lockfileVersion: LOCK_VERSION, items: checkItems(data.items ?? {}) };
}

/**
 * @param {unknown} items
 * @returns {Record<string, LockEntry>}
 */
function checkItems(items) {
  if (typeof items !== 'object' || items === null || Array.isArray(items)) {
    throw new Error(`${LOCK_FILE} : items doit être un objet`);
  }
  return /** @type {Record<string, LockEntry>} */ (items);
}

/**
 * Copie du verrou avec l'élément ajouté ou remplacé.
 * @param {Lock} lock
 * @param {string} name
 * @param {LockEntry} entry
 * @returns {Lock}
 */
export function withItem(lock, name, entry) {
  return { ...lock, items: { ...lock.items, [name]: entry } };
}

/**
 * @param {Lock} lock
 * @returns {string}
 */
export function serializeLock(lock) {
  const items = Object.fromEntries(
    Object.keys(lock.items)
      .sort()
      .map((name) => [name, lock.items[name]]),
  );
  return `${JSON.stringify({ ...lock, items }, null, INDENT)}\n`;
}
