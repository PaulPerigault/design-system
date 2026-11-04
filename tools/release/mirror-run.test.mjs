import { describe, expect, it } from 'vitest';
import { MirrorError, runMirror } from './mirror-run.mjs';
import { RegistryError } from './mirror-registry.mjs';

const manifests = [
  { name: '@paulperigault/tokens', version: '0.1.0' },
  { name: '@paulperigault/css', version: '0.1.0' },
  { name: '@paulperigault/docs', version: '0.0.0', private: true },
];
const clock = () => {
  let t = 0;
  return { now: () => t, sleep: async (ms) => void (t += ms) };
};
const wait = () => ({
  npm: { maxMs: 100, intervalMs: 10 },
  github: { maxMs: 100, intervalMs: 10 },
  clock: clock(),
});

/** Simule un miroir : `published` grossit à chaque publication, `events` garde l'ordre des appels. */
function setup({ onGithubAtEnd = () => true, githubError = null } = {}) {
  const events = [];
  const published = new Set();
  const probes = {
    onNpm: async () => true,
    onGithub: async (name, version) => {
      events.push(`sonde github ${name}`);
      if (githubError && published.size > 0) throw githubError;
      return published.has(`${name}@${version}`) && onGithubAtEnd(name);
    },
  };
  const publish = (spec) => (events.push(`publie ${spec}`), published.add(spec));
  return { events, probes, publish, log: (line) => events.push(`log ${line}`) };
}

describe('runMirror', () => {
  it('publie, puis contrôle la présence de chaque paquet public APRÈS la dernière publication', async () => {
    const { events, ...deps } = setup();
    await runMirror({ manifests, wait: wait(), ...deps });
    const last = events.lastIndexOf('publie @paulperigault/css@0.1.0');
    const firstCheck = events.findIndex((e, i) => i > last && e.startsWith('sonde github'));
    expect(last).toBeGreaterThan(-1);
    expect(firstCheck).toBe(last + 1);
    const checked = events.slice(last + 1).filter((e) => e.startsWith('sonde github'));
    expect(checked).toEqual([
      'sonde github @paulperigault/tokens',
      'sonde github @paulperigault/css',
    ]);
  });
  it('échoue, avec le paquet, quand une version manque après publication', async () => {
    const deps = setup({ onGithubAtEnd: (name) => name !== '@paulperigault/css' });
    const error = await runMirror({ manifests, wait: wait(), ...deps }).catch((e) => e);
    expect(error).toBeInstanceOf(MirrorError);
    expect(error.failures).toEqual([
      '@paulperigault/css@0.1.0 : absent de GitHub Packages après publication',
    ]);
  });
  it('un 403 sur la sonde finale donne le code HTTP et une explication', async () => {
    const deps = setup({ githubError: new RegistryError('GitHub Packages', 403) });
    const error = await runMirror({ manifests, wait: wait(), ...deps }).catch((e) => e);
    expect(error).toBeInstanceOf(MirrorError);
    expect(error.message).toContain('403');
    expect(error.message).toContain('contrôle de présence final impossible');
    expect(error.message).toContain('GITHUB_TOKEN');
  });
  it('un paquet absent de npmjs fait échouer le job sans rien publier', async () => {
    const deps = setup();
    deps.probes.onNpm = async () => false;
    const error = await runMirror({ manifests, wait: wait(), ...deps }).catch((e) => e);
    expect(error.failures.some((f) => f.includes('absent de npmjs'))).toBe(true);
    expect(deps.events.some((e) => e.startsWith('publie'))).toBe(false);
  });
  it('ne republie pas ce qui est déjà sur GitHub et ignore les paquets privés', async () => {
    const deps = setup();
    deps.probes.onGithub = async () => true;
    await runMirror({ manifests, wait: wait(), ...deps });
    expect(deps.events.some((e) => e.startsWith('publie'))).toBe(false);
    expect(deps.events).toContain('log ignoré : @paulperigault/docs (privé)');
  });
});
