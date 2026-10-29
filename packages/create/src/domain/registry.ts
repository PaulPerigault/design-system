import { posix } from 'node:path';
import { CreateError } from '../errors.ts';
import { isPlainObject } from './json.ts';

export const PACKAGE_NAME = '@paulperigault/astro';
export const REPO_PREFIX = 'packages/astro/';

export interface RegistryItem {
  name: string;
  title?: string;
  files: { path: string; type?: string }[];
  registryDependencies?: string[];
  meta?: Record<string, unknown>;
}

const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

/** Valide un fragment du registre à la frontière et rend un `RegistryItem` typé. */
export function toItem(data: unknown, path: string): RegistryItem {
  if (!isPlainObject(data) || typeof data.name !== 'string' || !Array.isArray(data.files)) {
    throw new CreateError(
      'registry.fragment-shape',
      `Fragment invalide (name ou files manquant) : ${path}`,
      { path },
    );
  }
  const files = data.files.flatMap((file: unknown) =>
    isPlainObject(file) && typeof file.path === 'string'
      ? [{ path: file.path, ...(typeof file.type === 'string' ? { type: file.type } : {}) }]
      : [],
  );
  if (files.length !== data.files.length) {
    throw new CreateError(
      'registry.fragment-path',
      `Fragment invalide (files[].path doit être une chaîne) : ${path}`,
      { path },
    );
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

export function findItem(items: RegistryItem[], query: string): RegistryItem {
  const wanted = query.trim().toLowerCase();
  const found = items.find(
    (item) => item.name.toLowerCase() === wanted || item.title?.toLowerCase() === wanted,
  );
  if (!found) {
    const names = items.map((item) => item.name).join(', ');
    throw new CreateError(
      'registry.item-missing',
      `Élément « ${query} » introuvable. Disponibles : ${names}`,
      { query },
    );
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
      throw new CreateError(
        'registry.path-outside',
        `Chemin hors du paquet dans « ${item.name} » : ${path}`,
        { name: item.name, path },
      );
    }
    return clean;
  });
}

/** Version lue dans le `package.json` déjà analysé ; `path` sert au message d'erreur. */
export function toVersion(manifest: unknown, path: string): string {
  const version = isPlainObject(manifest) ? manifest.version : undefined;
  if (typeof version !== 'string') {
    throw new CreateError(
      'package.version-missing',
      `package.json sans version (chaîne attendue) : ${path}`,
      { path },
    );
  }
  return version;
}
