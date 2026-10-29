import { posix } from 'node:path';
import type { CreateIo } from './io.ts';
import { resolveIn } from './io.ts';
import { isPlainObject } from './json.ts';

export const PACKAGE_NAME = '@paulperigault/astro';
export const REPO_PREFIX = 'packages/astro/';
const ITEMS_DIR = 'registry/items';
const INSTALL_HINT = `npm i ${PACKAGE_NAME}`;

export interface RegistryItem {
  name: string;
  title?: string;
  files: { path: string; type?: string }[];
  registryDependencies?: string[];
  meta?: Record<string, unknown>;
}

const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

/** Racine du paquet astro installé. */
export function packageRoot(io: CreateIo, from?: string): string {
  const root = resolveIn(io, from ?? `node_modules/${PACKAGE_NAME}`);
  if (!io.exists(posix.join(root, ITEMS_DIR))) {
    throw new Error(`${PACKAGE_NAME} introuvable dans ${root} : lancez ${INSTALL_HINT}`);
  }
  return root;
}

function readJson(io: CreateIo, path: string, message: string): unknown {
  try {
    return JSON.parse(io.readText(path));
  } catch (cause) {
    throw new Error(message, { cause });
  }
}

/** Valide un fragment du registre à la frontière et rend un `RegistryItem` typé. */
function toItem(data: unknown, path: string): RegistryItem {
  if (!isPlainObject(data) || typeof data.name !== 'string' || !Array.isArray(data.files)) {
    throw new Error(`Fragment invalide (name ou files manquant) : ${path}`);
  }
  const files = data.files.flatMap((file: unknown) =>
    isPlainObject(file) && typeof file.path === 'string'
      ? [{ path: file.path, ...(typeof file.type === 'string' ? { type: file.type } : {}) }]
      : [],
  );
  if (files.length !== data.files.length) {
    throw new Error(`Fragment invalide (files[].path doit être une chaîne) : ${path}`);
  }
  const { title, registryDependencies, meta } = data;
  return {
    name: data.name,
    files,
    ...(typeof title === 'string' ? { title } : {}),
    ...(isStrings(registryDependencies) ? { registryDependencies } : {}),
    ...(isPlainObject(meta) ? { meta } : {}),
  };
}

function parseItem(io: CreateIo, path: string): RegistryItem {
  return toItem(readJson(io, path, `Fragment invalide (JSON) : ${path}`), path);
}

export function loadItems(io: CreateIo, root: string): RegistryItem[] {
  const dir = posix.join(root, ITEMS_DIR);
  return io
    .readdir(dir)
    .filter((entry) => !entry.isDirectory() && entry.name.endsWith('.json'))
    .map((entry) => parseItem(io, posix.join(dir, entry.name)))
    .sort((a, b) => (a.name < b.name ? -1 : Number(a.name > b.name)));
}

export function findItem(items: RegistryItem[], query: string): RegistryItem {
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

/** Chemins des fichiers d'un élément, relatifs à la racine du paquet. */
export function itemFiles(item: RegistryItem): string[] {
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

export function packageVersion(io: CreateIo, root: string): string {
  const path = posix.join(root, 'package.json');
  const manifest = readJson(io, path, `package.json illisible (JSON invalide) : ${path}`);
  const version = isPlainObject(manifest) ? manifest.version : undefined;
  if (typeof version !== 'string') {
    throw new Error(`package.json sans version (chaîne attendue) : ${path}`);
  }
  return version;
}
