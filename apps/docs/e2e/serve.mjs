/**
 * Serveur statique minimal pour les tests E2E : sert `apps/docs/dist`, sans dépendance.
 * Remplace `astro preview`, qui se détache quand un agent IA est détecté.
 */
import { createReadStream, existsSync, readFileSync } from 'node:fs';
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

/** Règles de `dist/_headers` (format Cloudflare : chemin, puis lignes indentées `Nom: valeur`). */
export function parseHeaders(text) {
  const rules = [];
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    if (!/^\s/.test(line)) {
      rules.push({ prefix: line.trim().replace(/\*$/, ''), headers: {} });
    } else {
      const at = line.indexOf(':');
      rules.at(-1).headers[line.slice(0, at).trim()] = line.slice(at + 1).trim();
    }
  }
  return rules;
}

const HEADERS_FILE = join(ROOT, '_headers');
const RULES = existsSync(HEADERS_FILE) ? parseHeaders(readFileSync(HEADERS_FILE, 'utf8')) : [];

/** En-têtes des règles dont le préfixe couvre le chemin (`/*` couvre tout). */
export function headersFor(pathname, rules = RULES) {
  const matching = rules.filter((rule) => pathname.startsWith(rule.prefix));
  return Object.assign({}, ...matching.map((rule) => rule.headers));
}

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
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  res.writeHead(OK, { ...headersFor(pathname), 'content-type': type });
  createReadStream(found).pipe(res);
}

createServer((req, res) => {
  handle(req, res).catch(() => send(res, NOT_FOUND, 'Introuvable'));
}).listen(PORT, HOST);
