import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

/**
 * Écrit `dist/sw.js` après le build : en-tête de version + `sw-core.js` sans ses `export`
 * + écouteurs. Pas de précache global : seules les pages visitées sont mises en cache.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CORE_PATH = join(ROOT, 'src/lib/sw-core.js');
export const DIST_DIR = join(ROOT, 'dist');
const SW_NAME = 'sw.js';
const VERSION_LENGTH = 12;

const LISTENERS = `
self.addEventListener('fetch', (event) => {
  if (routeFor(event.request) === 'network') return;
  const deps = { caches, fetch: (request) => fetch(request), version: VERSION };
  event.respondWith(handleFetch(event.request, deps));
});
self.addEventListener('activate', (event) => {
  const purge = purgeOldCaches(caches, cacheName(VERSION));
  event.waitUntil(purge.then(() => self.clients.claim()));
});
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
`;

/** Liste triée (chemins relatifs, séparateur `/`) des fichiers de `dir`, hors `sw.js`. */
export async function listFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).split('\\').join('/'));
  return files.filter((file) => file !== SW_NAME).sort();
}

/** Empreinte SHA-256 tronquée de la liste des fichiers. */
export function versionOf(files) {
  return createHash('sha256').update(files.join('\n')).digest('hex').slice(0, VERSION_LENGTH);
}

/** Assemble le script : version, noyau sans `export`, écouteurs. */
export function buildSw(version, core) {
  const header = `// Service worker minimal, sans collecte de données.\nconst VERSION = '${version}';\n`;
  return `${header}${core.replace(/^export /gm, '')}${LISTENERS}`;
}

export async function writeSw(distDir = DIST_DIR, corePath = CORE_PATH) {
  const version = versionOf(await listFiles(distDir));
  const script = buildSw(version, await readFile(corePath, 'utf8'));
  await writeFile(join(distDir, SW_NAME), script);
  return { version, path: join(distDir, SW_NAME) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { version } = await writeSw();
  process.stdout.write(`sw.js écrit (version ${version})\n`);
}
