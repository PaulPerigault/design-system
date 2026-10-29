import { posix } from 'node:path';
import { resolveIn } from '../domain/paths.ts';
import { PACKAGE_NAME, toItem, toVersion } from '../domain/registry.ts';
import type { RegistryItem } from '../domain/registry.ts';
import { CreateError } from '../errors.ts';
import type { CreateIo } from './ports.ts';

const ITEMS_DIR = 'registry/items';
const INSTALL_HINT = `npm i ${PACKAGE_NAME}`;

/** Racine du paquet astro installé. */
export function packageRoot(io: CreateIo, from?: string): string {
  const root = resolveIn(io, from ?? `node_modules/${PACKAGE_NAME}`);
  if (!io.exists(posix.join(root, ITEMS_DIR))) {
    throw new CreateError(
      'registry.package-missing',
      `${PACKAGE_NAME} introuvable dans ${root} : lancez ${INSTALL_HINT}`,
      { root },
    );
  }
  return root;
}

function readJson(io: CreateIo, path: string): unknown {
  return JSON.parse(io.readText(path));
}

function parseItem(io: CreateIo, path: string): RegistryItem {
  try {
    return toItem(readJson(io, path), path);
  } catch (cause) {
    if (cause instanceof CreateError) throw cause;
    throw new CreateError(
      'registry.fragment-json',
      `Fragment invalide (JSON) : ${path}`,
      { path },
      { cause },
    );
  }
}

export function loadItems(io: CreateIo, root: string): RegistryItem[] {
  const dir = posix.join(root, ITEMS_DIR);
  return io
    .readdir(dir)
    .filter((entry) => !entry.isDirectory() && entry.name.endsWith('.json'))
    .map((entry) => parseItem(io, posix.join(dir, entry.name)))
    .sort((a, b) => (a.name < b.name ? -1 : Number(a.name > b.name)));
}

export function packageVersion(io: CreateIo, root: string): string {
  const path = posix.join(root, 'package.json');
  try {
    return toVersion(readJson(io, path), path);
  } catch (cause) {
    if (cause instanceof CreateError) throw cause;
    throw new CreateError(
      'package.unreadable',
      `package.json illisible (JSON invalide) : ${path}`,
      { path },
      { cause },
    );
  }
}
