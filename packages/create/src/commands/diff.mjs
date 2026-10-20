import { posix } from 'node:path';
import { sha256 } from '../lib/hash.mjs';
import { resolveIn } from '../lib/io.mjs';
import { readLock } from '../lib/lock.mjs';
import {
  findItem,
  itemFiles,
  loadItems,
  packageRoot,
  packageVersion,
  REPO_PREFIX,
} from '../lib/registry.mjs';

const CODE_SAME = 0;
const CODE_DIFF = 1;
const CODE_USAGE = 2;

/** Clé de rapprochement : chemin source sans préfixe du dépôt. */
const keyOf = (source) =>
  posix.normalize(source.startsWith(REPO_PREFIX) ? source.slice(REPO_PREFIX.length) : source);

/** @returns {string | undefined} contenu, ou undefined si le fichier est absent */
const readIfExists = (io, path) => (io.exists(path) ? io.readText(path) : undefined);

/**
 * Contenus des deux côtés, indexés par clé de rapprochement.
 * @returns {Map<string, { lock?: object, copy?: string, pkg?: string }>}
 */
function collect(io, entry, root, item) {
  const sides = new Map();
  const side = (key) => {
    if (!sides.has(key)) sides.set(key, {});
    return sides.get(key);
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

/** Origines d'une modification : `local` (copie) et/ou `paquet` (amont) par rapport au verrou. */
function causes({ lock, copy, pkg }) {
  if (!lock) return [];
  return [
    ['local', copy],
    ['paquet', pkg],
  ]
    .filter(([, text]) => sha256(text) !== lock.sha256)
    .map(([label]) => label);
}

/** Libellé de la différence d'un fichier, ou null s'il est identique. */
function classify(side) {
  const { lock, copy, pkg } = side;
  if (pkg === undefined) return lock === undefined ? null : 'supprimé';
  if (copy === undefined) return 'ajouté';
  if (copy === pkg) return null;
  const found = causes(side);
  return found.length > 0 ? `modifié (${found.join(', ')})` : 'modifié';
}

/** @returns {string[]} lignes `<statut> <source>`, triées par source */
function differences(sides) {
  return [...sides.keys()]
    .sort()
    .map((key) => [classify(sides.get(key)), key])
    .filter(([label]) => label !== null)
    .map(([label, key]) => `${label} ${key}`);
}

/** @returns {object | undefined} élément du registre (nom ou titre), undefined s'il a disparu */
function findOptional(items, query) {
  try {
    return findItem(items, query);
  } catch {
    return undefined;
  }
}

/**
 * Compare la copie éjectée d'un élément au paquet installé (lecture seule).
 * @param {{ positionals: string[], from?: string }} args
 * @param {{ io: import('../lib/io.mjs').CreateIo }} ctx
 * @returns {number}
 */
export function run({ positionals, from }, { io }) {
  if (positionals.length !== 1) {
    io.err('usage : diff <élément>');
    return CODE_USAGE;
  }
  const [name] = positionals;
  const { items: locked } = readLock(io);
  const key = Object.keys(locked).find((lockKey) => lockKey.toLowerCase() === name.toLowerCase());
  if (key === undefined) {
    io.err(`élément non éjecté : eject ${name} d'abord`);
    return CODE_USAGE;
  }
  const entry = locked[key];
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
