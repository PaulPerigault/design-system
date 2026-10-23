/**
 * Registre servi en statique au schéma shadcn (https://ui.shadcn.com/schema/registry-item.json).
 * Logique pure : la lecture des fichiers source est injectée, aucun accès disque ici.
 */
import { basename } from 'node:path';

/** Lit un fichier à partir de la racine du dépôt et renvoie son texte. */
export type ReadFile = (repoPath: string) => string;

export interface RegistryFile {
  path: string;
  type: string;
}

export interface RegistryItem {
  $schema?: string;
  name: string;
  type: string;
  title: string;
  description: string;
  files: RegistryFile[];
  meta?: unknown;
}

export interface Registry {
  $schema?: string;
  name: string;
  homepage?: string;
  items: RegistryItem[];
}

export interface ServedFile extends RegistryFile {
  /** Texte du fichier source, en ligne, comme l'exige le schéma. */
  content: string;
  /** Chemin d'installation chez le consommateur. */
  target: string;
}

export type ServedItem = Omit<RegistryItem, 'files'> & { files: ServedFile[] };

const COMPONENT_DIR = 'components/pp';
const LIB_DIR = 'lib/pp';

/** Les composants Astro vont dans components/pp, le reste (TypeScript, CSS) dans lib/pp. */
export function targetOf(repoPath: string): string {
  const dir = repoPath.endsWith('.astro') ? COMPONENT_DIR : LIB_DIR;
  return `${dir}/${basename(repoPath)}`;
}

function readOrThrow(readFile: ReadFile, repoPath: string): string {
  try {
    return readFile(repoPath);
  } catch (cause) {
    throw new Error(`Fichier du registre illisible : ${repoPath}`, { cause });
  }
}

function toServedFile(file: RegistryFile, readFile: ReadFile): ServedFile {
  return {
    path: file.path,
    type: file.type,
    content: readOrThrow(readFile, file.path),
    target: targetOf(file.path),
  };
}

/** Un élément complet, avec le contenu et la cible de chacun de ses fichiers. */
export function toServedItem(item: RegistryItem, readFile: ReadFile): ServedItem {
  return { ...item, files: item.files.map((file) => toServedFile(file, readFile)) };
}

/** Le registre allégé : sans contenu, chaque élément ne garde que les champs de l'index. */
export function toServedIndex(registry: Registry): Registry {
  return {
    ...registry,
    items: registry.items.map(({ name, type, title, description, files }) => ({
      name,
      type,
      title,
      description,
      files: files.map((file) => ({ path: file.path, type: file.type })),
    })),
  };
}
