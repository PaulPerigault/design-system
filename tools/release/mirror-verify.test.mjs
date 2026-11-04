import { describe, expect, it } from 'vitest';
import { RegistryError, githubHas } from './mirror-registry.mjs';
import { verifyOnGithub } from './mirror-verify.mjs';

const specs = [{ name: '@a/b', version: '1.0.0' }];
const wait = () => {
  let t = 0;
  return { maxMs: 0, intervalMs: 0, now: () => t, sleep: async (ms) => void (t += ms) };
};

describe('verifyOnGithub', () => {
  it('rien à signaler quand la version exacte est présente', async () => {
    expect(await verifyOnGithub(specs, async () => true, wait())).toEqual([]);
  });
  it('nomme la version absente', async () => {
    expect(await verifyOnGithub(specs, async () => false, wait())).toEqual([
      '@a/b@1.0.0 : absent de GitHub Packages après publication',
    ]);
  });
  it.each([401, 403])('%i : ligne d’échec avec le code et le jeton en cause', async (status) => {
    const reply = { status, json: async () => [] };
    const has = githubHas(async () => reply, { owner: 'PaulPerigault', token: 't' });
    const [line, ...rest] = await verifyOnGithub(specs, has, wait());
    expect(rest).toEqual([]);
    expect(line).toContain(String(status));
    expect(line).toContain('GITHUB_TOKEN');
  });
  it('500 : code conservé, sans prétendre expliquer', async () => {
    const has = async () => {
      throw new RegistryError('GitHub Packages', 500);
    };
    const [line] = await verifyOnGithub(specs, has, wait());
    expect(line).toContain('500');
    expect(line).not.toContain('GITHUB_TOKEN');
  });
  it('une erreur qui n’est pas du registre remonte', async () => {
    const has = async () => {
      throw new TypeError('réseau');
    };
    await expect(verifyOnGithub(specs, has, wait())).rejects.toThrow('réseau');
  });
});
