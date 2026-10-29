import { findItem, itemFiles, PACKAGE_NAME } from '../domain/registry.ts';
import type { RegistryItem } from '../domain/registry.ts';
import { messageOf } from '../domain/snippet.ts';
import { CreateError } from '../errors.ts';
import type { CreateIo } from './ports.ts';
import { loadItems, packageRoot, packageVersion } from './registry-io.ts';

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

function find(io: CreateIo, wanted: string, from: string | undefined): Located {
  const root = packageRoot(io, from);
  const item = findItem(loadItems(io, root), wanted);
  const version = packageVersion(io, root);
  if (version.trim() === '') {
    throw new CreateError(
      'package.version-empty',
      `${PACKAGE_NAME} installé sans version dans ${root}`,
      { root },
    );
  }
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
