import { Buffer } from 'node:buffer';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { colorsOf } from './og-colors.mjs';
import { nodeFs, ogFileOf, readPages } from './og-pages.mjs';
import { buildSvg } from './og-svg.mjs';
import { imageTitleOf } from './og-text.mjs';

/**
 * Post-build : écrit `dist/og/<slug>.png` (1200 × 630) pour chaque page qui déclare `og:image`,
 * d'après ses balises `og:title` et `og:description`. Aucune liste de pages à la main.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DIST_DIR = join(ROOT, 'dist');
export const LOGO_PATH = join(ROOT, 'public/image/logo.svg');

export const diskFs = {
  ...nodeFs,
  write: async (path, data) => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  },
};

export const rasterize = (svg) => sharp(Buffer.from(svg)).png().toBuffer();

export const logoUriOf = (svg) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

function assertSameText(target, known, page) {
  if (!known) return;
  if (known.title === page.title && known.description === page.description) return;
  throw new Error(`${target} : slug partagé par ${known.file} et ${page.file}.`);
}

/** Une image par fichier cible ; deux pages au même slug doivent partager titre et description. */
export function targetsOf(pages) {
  const targets = new Map();
  for (const { file, image, title, description } of pages) {
    if (!image) continue;
    const target = ogFileOf(image);
    assertSameText(target, targets.get(target), { file, title, description });
    targets.set(target, { file, title: title ?? '', description: description ?? '' });
  }
  return targets;
}

/** Écrit les images dans `distDir/og/` ; renvoie les fichiers écrits (relatifs à `distDir`). */
export async function generate({ distDir = DIST_DIR, fs = diskFs, render = rasterize, logoSvg }) {
  const colors = colorsOf();
  const logoUri = logoUriOf(logoSvg);
  const targets = targetsOf(await readPages(fs, distDir));
  for (const [target, { title, description }] of targets) {
    const svg = buildSvg({ title: imageTitleOf(title), description, colors, logoUri });
    await fs.write(join(distDir, target), await render(svg));
  }
  return [...targets.keys()];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const written = await generate({ logoSvg: await readFile(LOGO_PATH, 'utf8') });
  process.stdout.write(`og : ${written.length} image(s) écrite(s).\n`);
}
