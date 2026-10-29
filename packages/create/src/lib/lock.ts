import type { CreateIo } from './io.ts';
import { resolveIn } from './io.ts';
import { isPlainObject } from './json.ts';

export const LOCK_FILE = 'pp-ds.lock.json';
const LOCK_VERSION = 1;
const INDENT = 2;

export interface LockFile {
  source: string;
  path: string;
  sha256: string;
}

export interface LockEntry {
  package: string;
  version: string;
  files: LockFile[];
}

export interface Lock {
  lockfileVersion: number;
  items: Record<string, LockEntry>;
}

const emptyLock = (): Lock => ({ lockfileVersion: LOCK_VERSION, items: {} });

const isLockFile = (value: unknown): value is LockFile =>
  isPlainObject(value) &&
  typeof value.source === 'string' &&
  typeof value.path === 'string' &&
  typeof value.sha256 === 'string';

const isLockEntry = (value: unknown): value is LockEntry =>
  isPlainObject(value) &&
  typeof value.package === 'string' &&
  typeof value.version === 'string' &&
  Array.isArray(value.files) &&
  value.files.every(isLockFile);

/** Valide `items` à la frontière : un objet dont chaque entrée a la forme d'un `LockEntry`. */
function checkItems(items: unknown): Record<string, LockEntry> {
  if (!isPlainObject(items)) {
    throw new Error(`${LOCK_FILE} : items doit être un objet`);
  }
  const checked: Record<string, LockEntry> = {};
  for (const [name, entry] of Object.entries(items)) {
    if (!isLockEntry(entry)) throw new Error(`${LOCK_FILE} : l'entrée « ${name} » est invalide`);
    checked[name] = entry;
  }
  return checked;
}

function parseLock(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new Error(`${LOCK_FILE} illisible (JSON invalide)`, { cause });
  }
}

/** Lit le verrou ; absent → verrou vide. */
export function readLock(io: CreateIo): Lock {
  const path = resolveIn(io, LOCK_FILE);
  if (!io.exists(path)) return emptyLock();
  const data = parseLock(io.readText(path));
  const version = isPlainObject(data) ? data.lockfileVersion : undefined;
  if (!isPlainObject(data) || version !== LOCK_VERSION) {
    throw new Error(`${LOCK_FILE} : lockfileVersion ${String(version)} non pris en charge`);
  }
  return { lockfileVersion: LOCK_VERSION, items: checkItems(data.items ?? {}) };
}

/** Copie du verrou avec l'élément ajouté ou remplacé. */
export function withItem(lock: Lock, name: string, entry: LockEntry): Lock {
  return { ...lock, items: { ...lock.items, [name]: entry } };
}

export function serializeLock(lock: Lock): string {
  const items = Object.fromEntries(
    Object.keys(lock.items)
      .sort()
      .map((name) => [name, lock.items[name]]),
  );
  return `${JSON.stringify({ ...lock, items }, null, INDENT)}\n`;
}
