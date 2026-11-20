// Serveur statique de l'audit : sert `apps/docs/dist` comme l'hébergeur (en-têtes de `_headers`,
// type MIME `.wasm`, brotli quand le client l'accepte), pour mesurer ce que le visiteur reçoit.
import { readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { brotliCompressSync } from 'node:zlib';
import { forLocalHttp } from './csp.ts';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};
const OK = 200;
const NOT_FOUND = 404;
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.svg', '.wasm', '.txt', '.xml']);

/** Règles de `_headers` (format Cloudflare) : préfixe de chemin puis lignes `Nom: valeur`. */
export function parseHeaders(text: string): { prefix: string; headers: Record<string, string> }[] {
  const rules: { prefix: string; headers: Record<string, string> }[] = [];
  for (const line of text.split('\n').filter((l) => l.trim() !== '')) {
    const current = rules.at(-1);
    if (!/^\s/.test(line)) rules.push({ prefix: line.trim().replace(/\*$/, ''), headers: {} });
    else if (current)
      current.headers[line.slice(0, line.indexOf(':')).trim()] = line
        .slice(line.indexOf(':') + 1)
        .trim();
  }
  return rules;
}

type Rules = ReturnType<typeof parseHeaders>;

function fileFor(root: string, url: string): string | null {
  const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  const file = normalize(join(root, pathname));
  if (!file.startsWith(root)) return null;
  try {
    return statSync(file).isDirectory() ? join(file, 'index.html') : file;
  } catch {
    return null;
  }
}

/** En-têtes de l'hébergeur pour ce chemin, plus le type MIME et, si accepté, le brotli. */
function headersOf(
  rules: Rules,
  url: string,
  acceptEncoding: string,
  ext: string,
): Record<string, string> {
  const pathname = new URL(url, 'http://localhost').pathname;
  const matching = rules.filter((rule) => pathname.startsWith(rule.prefix));
  const headers: Record<string, string> = Object.assign(
    {},
    ...matching.map((rule) => rule.headers),
  );
  forLocalHttp(headers);
  headers['content-type'] = MIME[ext] ?? 'application/octet-stream';
  if (COMPRESSIBLE.has(ext) && acceptEncoding.includes('br')) headers['content-encoding'] = 'br';
  return headers;
}

/** Pour Lighthouse, qui ne fait aucun geste : `?wake` ajoute un clavier simulé et retire la CSP (page d'audit seulement). */
const WAKE =
  '<script>addEventListener("DOMContentLoaded",()=>dispatchEvent(new KeyboardEvent("keydown")))</script>';

function withWake(body: Buffer, headers: Record<string, string>, url: string): Buffer {
  const wanted = new URL(url, 'http://localhost').searchParams.has('wake');
  if (!wanted || !headers['content-type']?.startsWith('text/html')) return body;
  delete headers['Content-Security-Policy'];
  return Buffer.from(body.toString('utf8').replace('</body>', WAKE + '</body>'));
}

function read(file: string | null): Buffer | null {
  try {
    return readFileSync(file ?? '');
  } catch {
    return null;
  }
}

function respond(root: string, rules: Rules, req: IncomingMessage, res: ServerResponse): void {
  const url = req.url ?? '/';
  const file = fileFor(root, url);
  const body = read(file);
  if (body === null) {
    res.writeHead(NOT_FOUND).end('Introuvable');
    return;
  }
  const accept = String(req.headers['accept-encoding'] ?? '');
  const headers = headersOf(rules, url, accept, extname(file ?? '').toLowerCase());
  const sent = withWake(body, headers, url);
  res
    .writeHead(OK, headers)
    .end(headers['content-encoding'] === 'br' ? brotliCompressSync(sent) : sent);
}

/** Démarre le serveur sur un port libre ; rend l'URL de base et l'arrêt. */
export async function serve(dir: string): Promise<{ url: string; close: () => Promise<void> }> {
  const root = resolve(dir);
  const rules = parseHeaders(readFileSync(join(root, '_headers'), 'utf8'));
  const server: Server = createServer((req, res) => respond(root, rules, req, res));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const url = `http://127.0.0.1:${port}`;
  return { url, close: () => new Promise((done) => server.close(() => done())) };
}
