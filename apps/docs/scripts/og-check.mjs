import { Buffer } from 'node:buffer';
import { join } from 'node:path';
import { OG_IMAGE } from '../src/lib/site.ts';
import { ogFileOf } from './og-pages.mjs';

/**
 * Contrôle des images Open Graph : chaque page qui déclare `og:image` a son PNG dans `dist/og/`,
 * à la taille attendue. Logique pure, système de fichiers injecté (`read`).
 */

const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const IHDR_TYPE_OFFSET = 12;
const IHDR_WIDTH_OFFSET = 16;
const IHDR_HEIGHT_OFFSET = 20;
const IHDR_END = 24;

/** Dimensions lues dans l'en-tête IHDR d'un PNG ; `null` si ce n'est pas un PNG. */
export function pngSize(data) {
  const isPng =
    data.length >= IHDR_END && data.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
  if (!isPng || data.toString('latin1', IHDR_TYPE_OFFSET, IHDR_WIDTH_OFFSET) !== 'IHDR')
    return null;
  return {
    width: data.readUInt32BE(IHDR_WIDTH_OFFSET),
    height: data.readUInt32BE(IHDR_HEIGHT_OFFSET),
  };
}

/** `{ path }` du fichier attendu, ou `{ problem }` si l'URL n'est pas de la forme `/og/<slug>.png`. */
function fileOf(image) {
  try {
    return { path: ogFileOf(image) };
  } catch (error) {
    return { problem: error.message };
  }
}

/** Problème d'une page (texte) ou `null` ; `read` rejette si le fichier est absent. */
export async function problemOf(page, { fs, distDir, size = OG_IMAGE }) {
  if (!page.image) return null;
  const file = fileOf(page.image);
  if (file.problem) return `${page.file} : ${file.problem}`;
  const data = await fs.read(join(distDir, file.path)).catch(() => null);
  if (!data) return `${page.file} : ${file.path} absent`;
  const found = pngSize(Buffer.from(data));
  if (!found) return `${page.file} : ${file.path} n'est pas un PNG`;
  const same = found.width === size.width && found.height === size.height;
  return same ? null : `${page.file} : ${file.path} fait ${found.width}×${found.height}`;
}

/** Liste des problèmes de toutes les pages (vide = conforme). */
export async function checkOgImages(pages, options) {
  const problems = await Promise.all(pages.map((page) => problemOf(page, options)));
  return problems.filter((problem) => problem !== null);
}
