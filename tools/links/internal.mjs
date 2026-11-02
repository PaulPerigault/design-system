// Liens internes d'un site construit : fichier servi et ancre présents. Bloquant : 0 attendu.
import { extractIds, extractLinks } from './html-refs.mjs';
import { classify, servedFile } from './resolve.mjs';

/**
 * @param {{ page: string, html: string }} page page analysée (chemin relatif à `dist`)
 * @param {{ exists: (file: string) => boolean, read: (file: string) => string,
 *   origins?: string[], exceptions?: { url: string }[], cache?: Map<string, Set<string>> }} context système de fichiers injecté
 * @returns {{ page: string, url: string, problem: 'fichier' | 'ancre' }[]}
 */
export function internalProblems({ page, html }, context) {
  const { exceptions = [] } = context;
  context.cache ??= new Map();
  const skipped = new Set(exceptions.map((entry) => entry.url));
  return extractLinks(html)
    .filter(({ url }) => !skipped.has(url))
    .map(({ url }) => ({ url, problem: linkProblem(url, page, context) }))
    .filter((entry) => entry.problem !== undefined)
    .map((entry) => ({ page, ...entry }));
}

/** `'fichier'`, `'ancre'` ou `undefined` pour un lien qui tient. */
function linkProblem(url, page, context) {
  const link = classify(url, page, context.origins);
  if (link.kind !== 'internal') return undefined;
  const file = link.path === page ? page : servedFile(link.path, context.exists);
  if (file === undefined) return 'fichier';
  return missingAnchor(file, link.hash, context) ? 'ancre' : undefined;
}

function missingAnchor(file, hash, { read, cache }) {
  return hash !== '' && file.endsWith('.html') && !hasId(file, hash, read, cache);
}

function hasId(file, hash, read, cache) {
  if (!cache.has(file)) cache.set(file, extractIds(read(file)));
  return cache.get(file).has(hash);
}
