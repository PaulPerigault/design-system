import { posix } from 'node:path';
import type { CreateIo } from '../lib/io.ts';
import type { RegistryItem } from '../lib/registry.ts';
import {
  findItem,
  itemFiles,
  loadItems,
  PACKAGE_NAME,
  packageRoot,
  packageVersion,
} from '../lib/registry.ts';

/**
 * Ce que partagent `add` et `eject` : contrôle du positionnel, localisation de l'élément dans le
 * paquet installé et extrait d'import.
 */

export const CODE_OK = 0;
export const CODE_REFUSED = 1;
export const CODE_USAGE = 2;
const ASTRO_EXT = '.astro';

export interface Located {
  root: string;
  version: string;
  item: RegistryItem;
  files: string[];
}

export interface LocateRequest {
  command: string;
  positionals?: string[] | undefined;
  from?: string | undefined;
}

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function find(io: CreateIo, wanted: string, from: string | undefined): Located {
  const root = packageRoot(io, from);
  const item = findItem(loadItems(io, root), wanted);
  const version = packageVersion(io, root);
  if (version.trim() === '') throw new Error(`${PACKAGE_NAME} installé sans version dans ${root}`);
  return { root, item, version, files: itemFiles(item) };
}

/**
 * Élément demandé dans le paquet installé ; `null` (message sur `io.err`) si l'usage est faux ou
 * si le registre ne le fournit pas.
 */
export function locate(
  io: CreateIo,
  { command, positionals = [], from }: LocateRequest,
): Located | null {
  const [wanted] = positionals;
  if (positionals.length !== 1 || wanted === undefined) {
    io.err(`usage : ${command} <élément>`);
    return null;
  }
  try {
    return find(io, wanted, from);
  } catch (error) {
    io.err(messageOf(error));
    return null;
  }
}

/** Fichiers `.astro` seulement. */
export function astroFiles(files: string[]): string[] {
  return files.filter((file) => file.endsWith(ASTRO_EXT));
}

/** `import Stack from '<specifier>';` pour le composant du fichier `path`. */
export function importLine(path: string, specifier: string): string {
  return `import ${posix.basename(path, ASTRO_EXT)} from '${specifier}';`;
}
