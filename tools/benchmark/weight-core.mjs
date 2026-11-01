// Poids d'une page construite (#102) : parties pures. Une page = son HTML, ses feuilles de style,
// ses scripts, ses polices préchargées et ses images `<img>` ; les polices chargées à la demande
// (`unicode-range`) et les images en `srcset` non retenues par le navigateur ne sont pas comptées.
import { brotliCompressSync, gzipSync } from 'node:zlib';

export const TYPES = ['html', 'css', 'js', 'font', 'image', 'wasm'];
const BY_EXTENSION = { css: 'css', js: 'js', woff2: 'font', woff: 'font', wasm: 'wasm' };
const IMAGES = new Set(['avif', 'webp', 'jpg', 'jpeg', 'png', 'svg', 'gif']);
const LOCAL = /^\/(?!\/)[^"'\s?#]+/;

export function classify(path) {
  const extension = path.split('.').at(-1).toLowerCase();
  if (extension === 'html') return 'html';
  return IMAGES.has(extension) ? 'image' : (BY_EXTENSION[extension] ?? null);
}

const attributes = (html, tag, name) =>
  [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].flatMap(([element]) => {
    const value = new RegExp(`\\b${name}="([^"]*)"`).exec(element)?.[1];
    return value === undefined ? [[element, '']] : [[element, value]];
  });

/** Chemins locaux (`/_astro/…`) chargés par le HTML d'une page, sans doublon. */
export function references(html) {
  const links = attributes(html, 'link', 'href')
    .filter(([el]) => /rel="stylesheet"/.test(el) || /rel="preload"[^>]*as="font"/.test(el))
    .map(([, href]) => href);
  const scripts = attributes(html, 'script', 'src').map(([, src]) => src);
  const images = attributes(html, 'img', 'src').map(([, src]) => src);
  return [...new Set([...links, ...scripts, ...images])].filter((path) => LOCAL.test(path));
}

/** Octets bruts, gzip et brotli d'un contenu. */
export const sizes = (bytes) => ({
  raw: bytes.length,
  gzip: gzipSync(bytes, { level: 9 }).length,
  brotli: brotliCompressSync(bytes).length,
});

const empty = () => ({ raw: 0, gzip: 0, brotli: 0 });

/**
 * @param {string} html HTML de la page
 * @param {(path: string) => Uint8Array | null} read contenu d'un chemin du site (null si absent)
 * @returns {Record<string, {raw: number, gzip: number, brotli: number}>} par type
 */
export function pageWeight(html, read) {
  const total = Object.fromEntries(TYPES.map((type) => [type, empty()]));
  const add = (type, bytes) => {
    for (const [key, value] of Object.entries(sizes(bytes))) total[type][key] += value;
  };
  add('html', Buffer.from(html));
  for (const path of references(html)) {
    const type = classify(path);
    const bytes = type === null ? null : read(path);
    if (bytes) add(type, bytes);
  }
  return total;
}

export const sum = (weights, key) =>
  Object.values(weights).reduce((all, entry) => all + entry[key], 0);
