import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { syncVersions } from '../../packages/create/scripts/sync-versions-core.ts';
import {
  PACK_ARGS,
  contentFailure,
  dependencyFailure,
  manifests,
  packFailure,
  publishable,
  run,
} from './check-pack.mjs';

describe('check-pack', () => {
  it('accepte un code de sortie nul', () => {
    expect(packFailure({ status: 0, stderr: '' })).toBeNull();
  });
  it('décrit un échec de npm et une commande introuvable', () => {
    expect(packFailure({ status: 1, stderr: 'boum' })).toContain('code 1');
    expect(packFailure({ error: new Error('ENOENT') })).toContain('introuvable');
  });
  it('lance le script de npm par Node quand npm_execpath existe', () => {
    const seen = [];
    const spawn = (cmd, args, options) => (seen.push([cmd, args, options.shell]), { status: 0 });
    expect(run({ spawn, env: { npm_execpath: '/n/npm-cli.js' } })).toBeNull();
    expect(seen).toEqual([[process.execPath, ['/n/npm-cli.js', ...PACK_ARGS], undefined]]);
  });
  it('sinon lance npm, avec un interpréteur seulement sous Windows', () => {
    const seen = [];
    const spawn = (cmd, args, options) => (seen.push([cmd, args, options.shell]), { status: 0 });
    run({ spawn, platform: 'win32', env: {} });
    run({ spawn, platform: 'linux', env: {} });
    expect(seen).toEqual([
      ['npm', PACK_ARGS, true],
      ['npm', PACK_ARGS, false],
    ]);
  });
  it('liste les paquets publiables et leurs wasm', () => {
    const packages = publishable();
    expect(packages.size).toBe(9);
    expect(packages.get('@paulperigault/color')).toEqual({ wasm: true });
    expect(packages.get('@paulperigault/tokens')).toEqual({ wasm: false });
    expect(packages.has('@paulperigault/docs')).toBe(false);
  });
  it('bloque un fichier interdit et avertit d’un manque', () => {
    const packages = new Map([['@paulperigault/p', { wasm: false }]]);
    const entry = (paths) =>
      JSON.stringify(
        [{ name: '@paulperigault/p', files: paths.map((path) => ({ path })) }],
        null,
        2,
      );
    const warnings = [];
    const warn = (message) => warnings.push(message);
    expect(contentFailure(entry(['README.md', 'LICENSE', 'a.js']), packages, warn)).toBeNull();
    expect(contentFailure(entry(['README.md', 'LICENSE', '.env']), packages, warn)).toContain(
      '.env',
    );
    expect(contentFailure(entry(['a.js']), packages, warn)).toBeNull();
    expect(warnings).toEqual([
      '@paulperigault/p : README.md absent',
      '@paulperigault/p : LICENSE absent',
    ]);
  });
  it('bloque une dépendance interne à 0.0.0, * ou latest', () => {
    const tokens = { name: '@paulperigault/tokens', version: '0.1.0' };
    const css = (dependencies) => ({ name: '@paulperigault/css', version: '0.1.0', dependencies });
    const dep = (spec) => ({ '@paulperigault/tokens': spec });
    expect(dependencyFailure([tokens, css(dep('0.0.0'))], {})).toContain('amorce vide');
    expect(dependencyFailure([tokens, css(dep('*'))], {})).toContain('dépendance interne invalide');
    expect(dependencyFailure([tokens, css(dep('0.1.0'))], {})).toBeNull();
    const latest = { '@paulperigault/css': 'latest' };
    expect(dependencyFailure([tokens, css(dep('0.1.0'))], latest)).toContain('versions.json');
  });
});

/** Ce que fait release-please : version des paquets et de leurs dépendances internes à 0.1.0. */
function releaseState(entries) {
  const FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
  const bump = (deps) =>
    Object.fromEntries(
      Object.entries(deps).map(([k, v]) => [k, k.startsWith('@paulperigault/') ? '0.1.0' : v]),
    );
  return entries.map((m) => ({
    ...m,
    version: '0.1.0',
    ...Object.fromEntries(FIELDS.filter((f) => m[f]).map((f) => [f, bump(m[f])])),
  }));
}

describe('check-pack : gabarit de create, état empaqueté', () => {
  const committed = JSON.parse(readFileSync('packages/create/templates/versions.json', 'utf8'));
  /** Ce que `prepack` écrit dans le gabarit : les versions réelles des paquets du dépôt. */
  const packed = (entries) => {
    const byName = new Map(entries.map((m) => [m.name, m.version]));
    return syncVersions(committed, (name) => byName.get(name)).next;
  };

  it('accepte le dépôt dans son état courant une fois `prepack` passé', () => {
    const entries = manifests();
    expect(dependencyFailure(entries, packed(entries))).toBeNull();
  });

  it('accepte l’état de la PR de release une fois `prepack` passé', () => {
    const entries = releaseState(manifests());
    expect(dependencyFailure(entries, packed(entries))).toBeNull();
  });

  it('ne lit pas le fichier commité : release-please ne le met pas à jour', () => {
    const entries = releaseState(manifests());
    expect(dependencyFailure(entries, committed)).toContain('templates/versions.json');
  });
});
