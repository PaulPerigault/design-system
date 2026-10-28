import { describe, expect, it } from 'vitest';
import { PACK_ARGS, packFailure, run } from './check-pack.mjs';

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
});
