import { posix } from 'node:path';

/**
 * Ce que partagent `add`, `eject` et `diff` sans entrée-sortie : codes de sortie, message d'erreur
 * et extrait d'import.
 */

export const CODE_OK = 0;
export const CODE_REFUSED = 1;
export const CODE_USAGE = 2;
const ASTRO_EXT = '.astro';

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Fichiers `.astro` seulement. */
export function astroFiles(files: string[]): string[] {
  return files.filter((file) => file.endsWith(ASTRO_EXT));
}

/** `import Stack from '<specifier>';` pour le composant du fichier `path`. */
export function importLine(path: string, specifier: string): string {
  return `import ${posix.basename(path, ASTRO_EXT)} from '${specifier}';`;
}
