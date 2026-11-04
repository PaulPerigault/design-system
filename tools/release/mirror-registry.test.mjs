import { describe, expect, it } from 'vitest';
import { RegistryError, githubHas, npmjsHas, waitFor } from './mirror-registry.mjs';

const reply = (status, body = []) => ({ status, json: async () => body });
const fakeFetch = (status, body) => async () => reply(status, body);
const auth = { owner: 'PaulPerigault', token: 't' };

describe('npmjsHas', () => {
  it('200 présent, 404 absent', async () => {
    expect(await npmjsHas(fakeFetch(200))('@a/b', '1.0.0')).toBe(true);
    expect(await npmjsHas(fakeFetch(404))('@a/b', '1.0.0')).toBe(false);
  });
  it.each([401, 403, 500])('%i : échec franc, jamais « présent »', async (status) => {
    const probe = npmjsHas(fakeFetch(status));
    await expect(probe('@a/b', '1.0.0')).rejects.toMatchObject({ name: 'RegistryError', status });
  });
  it('encode la portée', async () => {
    let url = '';
    await npmjsHas(async (u) => ((url = u), reply(200)))('@a/b', '1.0.0');
    expect(url).toBe('https://registry.npmjs.org/@a%2fb/1.0.0');
  });
});

describe('githubHas', () => {
  it('vérifie la version exacte, pas seulement le nom', async () => {
    const versions = [{ name: '0.0.9' }];
    expect(await githubHas(fakeFetch(200, versions), auth)('@a/b', '0.1.0')).toBe(false);
    versions.push({ name: '0.1.0' });
    expect(await githubHas(fakeFetch(200, versions), auth)('@a/b', '0.1.0')).toBe(true);
  });
  it('404 absent ; 401, 403, 500 : erreur typée', async () => {
    expect(await githubHas(fakeFetch(404), auth)('@a/b', '1.0.0')).toBe(false);
    for (const status of [401, 403, 500]) {
      const error = await githubHas(fakeFetch(status), auth)('@a/b', '1.0.0').catch((e) => e);
      expect(error).toBeInstanceOf(RegistryError);
      expect(error.status).toBe(status);
    }
  });
  it('envoie le jeton et interroge le nom sans portée', async () => {
    let seen = {};
    await githubHas(async (u, o) => ((seen = { u, o }), reply(404)), auth)('@a/tokens', '1.0.0');
    expect(seen.u).toContain('/users/PaulPerigault/packages/npm/tokens/versions');
    expect(seen.o.headers.authorization).toBe('Bearer t');
  });
});

describe('waitFor', () => {
  const specs = [{ name: '@a/b', version: '1.0.0' }];
  const clock = () => {
    let t = 0;
    return { now: () => t, sleep: async (ms) => void (t += ms) };
  };

  it('attend la propagation puis réussit', async () => {
    let calls = 0;
    const has = async () => ++calls >= 3;
    const result = await waitFor(specs, has, { maxMs: 600, intervalMs: 100, ...clock() });
    expect(result.missing).toEqual([]);
    expect(calls).toBe(3);
  });
  it('rend le manquant quand le délai est écoulé', async () => {
    const result = await waitFor(specs, async () => false, {
      maxMs: 250,
      intervalMs: 100,
      ...clock(),
    });
    expect(result.missing).toEqual(['@a/b@1.0.0']);
  });
  it('une seule passe avec un délai nul', async () => {
    const result = await waitFor(specs, async () => false, { maxMs: 0, intervalMs: 0, ...clock() });
    expect(result.missing).toEqual(['@a/b@1.0.0']);
  });
  it('propage une erreur de registre', async () => {
    const has = async () => {
      throw new RegistryError('npmjs', 500);
    };
    await expect(waitFor(specs, has, { maxMs: 1, intervalMs: 1, ...clock() })).rejects.toThrow(
      '500',
    );
  });
});
