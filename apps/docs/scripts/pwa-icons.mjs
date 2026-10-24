import { Buffer } from 'node:buffer';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/**
 * Génère les icônes PWA depuis le logo (lecture seule) : `public/pwa/*.png`.
 * Idempotent : un fichier identique n'est pas réécrit.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const LOGO_PATH = join(ROOT, 'public/image/logo.svg');
export const OUT_DIR = join(ROOT, 'public/pwa');

export const SIZE_SMALL = 192;
export const SIZE_LARGE = 512;
/** Zone de sécurité des icônes maskable : le logo occupe 80 % du côté. */
export const MASKABLE_RATIO = 0.8;
/** Résolution de rastérisation du SVG, avant réduction à la taille cible. */
const RASTER_DENSITY = 288;
/** Le logo est centré : marge = (côté - logo) / 2. */
const MARGIN_SIDES = 2;

/** Couleur de fond du logo : attribut `fill` du `<rect>` racine. */
export function logoColor(svg) {
  const match = /<rect\b[^>]*\bfill="(#[0-9a-fA-F]{6})"/.exec(svg);
  if (!match) throw new Error('Couleur de fond introuvable dans le logo SVG.');
  return match[1];
}

async function rasterLogo(svg, size) {
  const image = sharp(Buffer.from(svg), { density: RASTER_DENSITY });
  return image.resize(size, size).png().toBuffer();
}

/** Icône carrée « any » : le logo tel quel. */
export function renderIcon(svg, size) {
  return rasterLogo(svg, size);
}

/** Icône maskable : logo à 80 % au centre d'un fond uni de la couleur du logo. */
export async function renderMaskable(svg, size) {
  const inner = Math.round(size * MASKABLE_RATIO);
  const offset = Math.round((size - inner) / MARGIN_SIDES);
  return sharp({
    create: { width: size, height: size, channels: 3, background: logoColor(svg) },
  })
    .composite([{ input: await rasterLogo(svg, inner), left: offset, top: offset }])
    .png()
    .toBuffer();
}

async function writeIfChanged(path, data) {
  const current = await readFile(path).catch(() => null);
  if (current && current.equals(data)) return false;
  await writeFile(path, data);
  return true;
}

/** Produit les trois PNG dans `outDir` ; renvoie les noms de fichiers réécrits. */
export async function generate({ logoPath = LOGO_PATH, outDir = OUT_DIR } = {}) {
  const svg = await readFile(logoPath, 'utf8');
  const targets = {
    'icon-192.png': () => renderIcon(svg, SIZE_SMALL),
    'icon-512.png': () => renderIcon(svg, SIZE_LARGE),
    'icon-maskable-512.png': () => renderMaskable(svg, SIZE_LARGE),
  };
  await mkdir(outDir, { recursive: true });
  const written = [];
  for (const [name, render] of Object.entries(targets)) {
    if (await writeIfChanged(join(outDir, name), await render())) written.push(name);
  }
  return written;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const written = await generate();
  process.stdout.write(`pwa-icons : ${written.length} fichier(s) écrit(s).\n`);
}
