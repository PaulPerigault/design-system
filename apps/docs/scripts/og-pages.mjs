import { readFile, readdir } from 'node:fs/promises';
import { posix } from 'node:path';
import { URL } from 'node:url';

/**
 * Lecture des pages construites : balises Open Graph et fichier image attendu.
 * Le système de fichiers est injecté (`list`, `read`) ; `nodeFs` est l'implémentation réelle.
 */

const META_TAG = /<meta\b[^>]*>/giu;
const ATTRIBUTE = /([a-z:_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/giu;
const OG_FILE = /^\/og\/([a-z0-9-]+\.png)$/u;
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const HEX_RADIX = 16;

export const nodeFs = {
  /** Chemins relatifs (séparateur `/`) des fichiers `.html` sous `dir`. */
  list: async (dir) => {
    const names = await readdir(dir, { recursive: true, encoding: 'utf8' });
    return names.map((name) => name.split('\\').join('/')).filter((name) => name.endsWith('.html'));
  },
  read: (path) => readFile(path),
};

/** Décode les entités HTML courantes (nommées, décimales, hexadécimales). */
export function decodeEntities(text) {
  return text.replace(/&(?:#x([0-9a-f]+)|#(\d+)|([a-z]+));/giu, (whole, hex, dec, name) => {
    if (hex) return String.fromCodePoint(Number.parseInt(hex, HEX_RADIX));
    if (dec) return String.fromCodePoint(Number(dec));
    return ENTITIES[name.toLowerCase()] ?? whole;
  });
}

function attributesOf(tag) {
  const found = {};
  for (const [, name, double, single] of tag.matchAll(ATTRIBUTE)) {
    found[name.toLowerCase()] = decodeEntities(double ?? single ?? '');
  }
  return found;
}

/** Première valeur de chaque `<meta property="og:*" content>`, indexée par propriété. */
function ogProperties(html) {
  const og = {};
  for (const [tag] of html.matchAll(META_TAG)) {
    const { property = '', content } = attributesOf(tag);
    if (property.startsWith('og:') && content !== undefined) og[property] ??= content;
  }
  return og;
}

/** `{ image, title, description }` (chaînes ou `null`) lus dans les `<meta property="og:*">`. */
export function readOgMeta(html) {
  const og = ogProperties(html);
  return {
    image: og['og:image'] ?? null,
    title: og['og:title'] ?? null,
    description: og['og:description'] ?? null,
  };
}

/** Fichier de l'image relatif à `dist` (`og/<slug>.png`) ; refuse tout autre chemin. */
export function ogFileOf(image) {
  const match = OG_FILE.exec(new URL(image).pathname);
  if (!match) throw new Error(`og:image hors de /og/<slug>.png : ${image}`);
  return `og/${match[1]}`;
}

/** Une page : chemin du fichier HTML (relatif à `dist`) et ses balises Open Graph. */
export async function pageOf(fs, distDir, file) {
  const html = (await fs.read(posix.join(distDir, file))).toString('utf8');
  return { file, ...readOgMeta(html) };
}

/** Toutes les pages HTML de `dist`, triées. */
export async function readPages(fs, distDir) {
  const files = (await fs.list(distDir)).sort();
  return Promise.all(files.map((file) => pageOf(fs, distDir, file)));
}
