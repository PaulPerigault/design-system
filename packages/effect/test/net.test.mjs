import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { cwd, fetchText, fetcherLayer, processLayer } from '../src/index.ts';

const response = (status, body = '') => ({ status, text: async () => body });
const run = (effect, layer) => Effect.runPromise(Effect.provide(effect, layer));
const fail = (effect, layer) => Effect.runPromise(Effect.flip(Effect.provide(effect, layer)));

describe('adaptateur réseau', () => {
  it('rend le corps d’une réponse 2xx, sans réseau réel', async () => {
    const calls = [];
    const layer = fetcherLayer({
      fetch: async (url) => (calls.push(url), response(200, 'bonjour')),
    });
    expect(await run(fetchText('https://exemple.test/a'), layer)).toBe('bonjour');
    expect(calls).toEqual(['https://exemple.test/a']);
  });
  it('transforme un statut hors 2xx en FetchError typée', async () => {
    const error = await fail(
      fetchText('https://exemple.test/x'),
      fetcherLayer({ fetch: async () => response(404) }),
    );
    expect(error._tag).toBe('FetchError');
    expect(error.url).toBe('https://exemple.test/x');
    expect(error.reason).toContain('404');
  });
  it('transforme un échec du réseau en FetchError typée', async () => {
    const layer = fetcherLayer({
      fetch: async () => {
        throw new Error('réseau coupé');
      },
    });
    const error = await fail(fetchText('https://exemple.test/y'), layer);
    expect(error.reason).toBe('réseau coupé');
  });
});

describe('adaptateur de processus', () => {
  it('rend le dossier courant du port fourni', async () => {
    const layer = processLayer({ cwd: () => '/projet', argv: () => [] });
    expect(await run(cwd, layer)).toBe('/projet');
  });
});
