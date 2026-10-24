/* global URL */
/**
 * Noyau du service worker : JS pur, sans effet de bord à l'import.
 * Dépendances injectées (`caches`, `fetch`). Aucune collecte, aucun réseau tiers.
 * Concaténé dans `dist/sw.js` par `scripts/sw.mjs` (les `export` sont retirés).
 */

export const CACHE_PREFIX = 'pp-docs-';
const HASHED_PREFIXES = ['/_astro/', '/pwa/'];
const NETWORK_ONLY_PREFIX = '/pagefind/';

export const cacheName = (version) => `${CACHE_PREFIX}${version}`;

/**
 * Stratégie d'une requête : `network` (ne pas intercepter), `network-first` ou `cache-first`.
 * `origin` vaut l'origine du worker par défaut.
 */
export function routeFor(request, origin = globalThis.location?.origin) {
  if (request.method !== 'GET') return 'network';
  const url = new URL(request.url);
  if (url.origin !== origin) return 'network';
  if (url.pathname.startsWith(NETWORK_ONLY_PREFIX)) return 'network';
  if (HASHED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return 'cache-first';
  return request.mode === 'navigate' ? 'network-first' : 'network';
}

async function store(deps, request, response) {
  if (!response.ok || response.type !== 'basic') return;
  const cache = await deps.caches.open(cacheName(deps.version));
  await cache.put(request, response.clone());
}

async function networkFirst(request, deps) {
  try {
    const response = await deps.fetch(request);
    await store(deps, request, response);
    return response;
  } catch (error) {
    const cached = await deps.caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request, deps) {
  const cached = await deps.caches.match(request);
  if (cached) return cached;
  const response = await deps.fetch(request);
  await store(deps, request, response);
  return response;
}

/** Répond à une requête selon sa stratégie ; `deps` = `{ caches, fetch, version, origin? }`. */
export function handleFetch(request, deps) {
  const route = routeFor(request, deps.origin);
  if (route === 'network-first') return networkFirst(request, deps);
  if (route === 'cache-first') return cacheFirst(request, deps);
  return deps.fetch(request);
}

/** Supprime les caches `pp-docs-*` autres que `current`. */
export async function purgeOldCaches(caches, current) {
  const names = await caches.keys();
  const stale = names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== current);
  await Promise.all(stale.map((name) => caches.delete(name)));
  return stale;
}
