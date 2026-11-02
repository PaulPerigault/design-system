import { describe, expect, it } from 'vitest';
import { PACK_ARGS, contentFailure, packFailure, publishable, run } from './check-pack.mjs';

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
});
