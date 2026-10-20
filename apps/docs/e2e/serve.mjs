/**
 * Serveur statique minimal pour les tests E2E : sert `apps/docs/dist`, sans dépendance.
 * Remplace `astro preview`, qui se détache quand un agent IA est détecté.
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { URL, fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../dist/', import.meta.url));
const PORT = 4321;
const HOST = '127.0.0.1';
const OK = 200;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

/** Chemin disque sûr pour une URL, ou `null` si elle sort de la racine. */
export function resolvePath(url) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  } catch {
    return null;
  }
  if (pathname.split('/').includes('..')) return null;
  const file = normalize(join(ROOT, pathname));
  return file.startsWith(ROOT) || `${file}${sep}` === ROOT ? file : null;
}

/** Fichier réel à servir : index de dossier si besoin, `null` si absent. */
async function findFile(file) {
  try {
    const info = await stat(file);
    if (!info.isDirectory()) return file;
    const index = join(file, 'index.html');
    return (await stat(index)).isFile() ? index : null;
  } catch {
    return null;
  }
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(body);
}

async function handle(req, res) {
  const file = resolvePath(req.url ?? '/');
  if (file === null) return send(res, BAD_REQUEST, 'Requête refusée');
  const found = await findFile(file);
  if (found === null) return send(res, NOT_FOUND, 'Introuvable');
  const type = MIME[extname(found).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(OK, { 'content-type': type });
  createReadStream(found).pipe(res);
}

createServer((req, res) => {
  handle(req, res).catch(() => send(res, NOT_FOUND, 'Introuvable'));
}).listen(PORT, HOST);
