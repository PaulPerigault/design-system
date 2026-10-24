import { describe, expect, it, vi } from 'vitest';
import { cacheName, handleFetch, purgeOldCaches, routeFor } from './sw-core.js';

const ORIGIN = 'https://example.test';

const req = (path: string, init: { method?: string; mode?: string } = {}) =>
  ({ url: `${ORIGIN}${path}`, method: init.method ?? 'GET', mode: init.mode ?? 'cors' }) as Request;

function makeDeps(fetchImpl: (r: Request) => Promise<unknown>) {
  const cache = { put: vi.fn(async () => undefined) };
  const store = new Map<string, unknown>();
  const caches = {
    open: vi.fn(async () => cache),
    match: vi.fn(async (r: Request | string) => store.get(typeof r === 'string' ? r : r.url)),
  };
  const fetch = vi.fn(fetchImpl);
  return { caches, cache, store, fetch, deps: { caches, fetch, version: 'v1', origin: ORIGIN } };
}

const okResponse = () => ({ ok: true, type: 'basic', clone: () => 'copy' });

describe('routeFor', () => {
  it('navigation : réseau d’abord', () => {
    expect(routeFor(req('/a/', { mode: 'navigate' }), ORIGIN)).toBe('network-first');
  });
  it('fichiers à empreinte : cache d’abord', () => {
    expect(routeFor(req('/_astro/x.js'), ORIGIN)).toBe('cache-first');
    expect(routeFor(req('/pwa/icon-192.png'), ORIGIN)).toBe('cache-first');
  });
  it('jamais de cache hors origine, hors GET, ni pour pagefind', () => {
    const foreign = { ...req('/_astro/x.js'), url: 'https://autre.test/_astro/x.js' } as Request;
    expect(routeFor(foreign, ORIGIN)).toBe('network');
    expect(routeFor(req('/_astro/x.js', { method: 'POST' }), ORIGIN)).toBe('network');
    expect(routeFor(req('/pagefind/pagefind.js', { mode: 'navigate' }), ORIGIN)).toBe('network');
  });
  it('autres requêtes : non interceptées', () => {
    expect(routeFor(req('/api'), ORIGIN)).toBe('network');
  });
});

describe('handleFetch', () => {
  it('navigation : met en cache la réponse réseau', async () => {
    const t = makeDeps(async () => okResponse());
    await handleFetch(req('/a/', { mode: 'navigate' }), t.deps);
    expect(t.caches.open).toHaveBeenCalledWith(cacheName('v1'));
    expect(t.cache.put).toHaveBeenCalledOnce();
  });
  it('navigation hors ligne : repli sur le cache', async () => {
    const t = makeDeps(async () => Promise.reject(new Error('offline')));
    t.store.set(`${ORIGIN}/a/`, 'en-cache');
    expect(await handleFetch(req('/a/', { mode: 'navigate' }), t.deps)).toBe('en-cache');
  });
  it('navigation hors ligne sans cache : erreur propagée', async () => {
    const t = makeDeps(async () => Promise.reject(new Error('offline')));
    await expect(handleFetch(req('/a/', { mode: 'navigate' }), t.deps)).rejects.toThrow('offline');
  });
  it('cache d’abord : n’appelle pas le réseau si présent', async () => {
    const t = makeDeps(async () => okResponse());
    t.store.set(`${ORIGIN}/_astro/x.js`, 'en-cache');
    expect(await handleFetch(req('/_astro/x.js'), t.deps)).toBe('en-cache');
    expect(t.fetch).not.toHaveBeenCalled();
  });
  it('ne met pas en cache une réponse en erreur', async () => {
    const t = makeDeps(async () => ({ ok: false, type: 'basic', clone: () => 'x' }));
    await handleFetch(req('/_astro/y.js'), t.deps);
    expect(t.cache.put).not.toHaveBeenCalled();
  });
  it('pagefind : réseau seulement, rien en cache', async () => {
    const t = makeDeps(async () => okResponse());
    await handleFetch(req('/pagefind/p.js'), t.deps);
    expect(t.fetch).toHaveBeenCalledOnce();
    expect(t.cache.put).not.toHaveBeenCalled();
  });
});

describe('purgeOldCaches', () => {
  it('supprime les anciens pp-docs-* et laisse le reste', async () => {
    const keys = ['pp-docs-old', 'pp-docs-v2', 'autre'];
    const caches = { keys: async () => keys, delete: vi.fn(async () => true) };
    expect(await purgeOldCaches(caches, 'pp-docs-v2')).toEqual(['pp-docs-old']);
    expect(caches.delete).toHaveBeenCalledOnce();
    expect(caches.delete).toHaveBeenCalledWith('pp-docs-old');
  });
});
