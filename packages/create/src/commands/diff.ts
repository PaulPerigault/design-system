import { posix } from 'node:path';
import type { CreateIo } from '../lib/io.ts';
import { resolveIn } from '../lib/io.ts';
import { readLock } from '../lib/lock.ts';
import type { LockEntry } from '../lib/lock.ts';
import {
  findItem,
  itemFiles,
  loadItems,
  packageRoot,
  packageVersion,
  REPO_PREFIX,
} from '../lib/registry.ts';
import type { RegistryItem } from '../lib/registry.ts';
import { differences } from './diff-sides.ts';
import type { Side } from './diff-sides.ts';

const CODE_SAME = 0;
const CODE_DIFF = 1;
const CODE_USAGE = 2;

/** Clé de rapprochement : chemin source sans préfixe du dépôt. */
const keyOf = (source: string): string =>
  posix.normalize(source.startsWith(REPO_PREFIX) ? source.slice(REPO_PREFIX.length) : source);

/** Contenu, ou `undefined` si le fichier est absent. */
const readIfExists = (io: CreateIo, path: string): string | undefined =>
  io.exists(path) ? io.readText(path) : undefined;

/** Contenus des deux côtés, indexés par clé de rapprochement. */
function collect(
  io: CreateIo,
  entry: LockEntry,
  root: string,
  item: RegistryItem | undefined,
): Map<string, Side> {
  const sides = new Map<string, Side>();
  const side = (key: string): Side => {
    const found = sides.get(key) ?? {};
    sides.set(key, found);
    return found;
  };
  for (const file of entry.files) {
    Object.assign(side(keyOf(file.source)), {
      lock: file,
      copy: readIfExists(io, resolveIn(io, file.path)),
    });
  }
  for (const rel of item ? itemFiles(item) : []) {
    side(rel).pkg = readIfExists(io, posix.join(root, rel));
  }
  return sides;
}

/** Élément du registre (nom ou titre), `undefined` s'il a disparu. */
function findOptional(items: RegistryItem[], query: string): RegistryItem | undefined {
  try {
    return findItem(items, query);
  } catch {
    return undefined;
  }
}

export interface DiffArgs {
  positionals: string[];
  from?: string | undefined;
}

/** Compare la copie éjectée d'un élément au paquet installé (lecture seule). */
export function run({ positionals, from }: DiffArgs, { io }: { io: CreateIo }): number {
  const [name] = positionals;
  if (positionals.length !== 1 || name === undefined) {
    io.err('usage : diff <élément>');
    return CODE_USAGE;
  }
  const { items: locked } = readLock(io);
  const key = Object.keys(locked).find((lockKey) => lockKey.toLowerCase() === name.toLowerCase());
  const entry = key === undefined ? undefined : locked[key];
  if (key === undefined || entry === undefined) {
    io.err(`élément non éjecté : eject ${name} d'abord`);
    return CODE_USAGE;
  }
  const root = packageRoot(io, from);
  const item = findOptional(loadItems(io, root), key);
  const lines = differences(collect(io, entry, root, item));
  io.out(`${key} : copie ${entry.version}, paquet ${packageVersion(io, root)}`);
  if (lines.length === 0) {
    io.out(`${key} : identique au paquet`);
    return CODE_SAME;
  }
  lines.forEach((line) => io.out(line));
  return CODE_DIFF;
}
