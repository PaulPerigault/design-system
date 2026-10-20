// Parcours récursif des fichiers d'un dossier, filtré par extension, sans dossiers générés.
import { readdirSync } from 'node:fs';
import { extname, join } from 'node:path';

const SKIPPED = new Set(['node_modules', 'dist', '.astro', '.git', 'coverage', 'test-results']);

/**
 * @param {string} dir dossier de départ
 * @param {string[]} extensions extensions retenues (`.ts`, `.mjs`…)
 * @returns {string[]} chemins des fichiers retenus
 */
export function walk(dir, extensions) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return SKIPPED.has(entry.name) ? [] : walk(path, extensions);
    return extensions.includes(extname(entry.name)) ? [path] : [];
  });
}
