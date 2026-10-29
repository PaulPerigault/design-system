import { describe, expect, it } from 'vitest';
import { main } from '../src/infrastructure/cli.ts';
import { fakeIo } from './fake-io.ts';

const TOKENS = JSON.stringify({ themes: { light: { '--pp-a': '1' } }, base: {} });
const files = {
  'tokens.json': TOKENS,
  'src/a.ts': 'a\nb\nc\n',
  'src/ok.css': 'p { color: var(--pp-a); }\n',
  'src/t.md': 'Bonjour le monde\n',
};
const exec = (argv: string[], extra: Record<string, string> = {}) => {
  const fake = fakeIo({ ...files, ...extra });
  return { code: main(argv, fake.io), out: fake.out, err: fake.err };
};
const conf = (data: unknown, name = 'pp-guards.config.json') => ({ [name]: JSON.stringify(data) });
const tokensSection = { tokens: 'tokens.json', roots: ['src'] };

describe('usage et aide', () => {
  it('--help : usage sur out, code 0', () => {
    const { code, out } = exec(['--help']);
    expect([code, out[0]]).toEqual([0, expect.stringContaining('usage : pp-guards')]);
  });

  it('<contrôle> --help : usage du contrôle, code 0', () => {
    const { code, out } = exec(['size', '--help']);
    expect(code).toBe(0);
    expect(out[0]).toContain('pp-guards size');
    expect(out[0]).toContain('--max');
  });

  it.each([[[]], [['bogus']], [['size', '--bogus']], [['all', 'src']]])('%j : code 2', (argv) => {
    const { code, err } = exec(argv);
    expect(code).toBe(2);
    expect(err.join('\n')).toContain('usage : pp-guards');
  });
});

describe('dispatch', () => {
  it('size : problème -> 1, sinon 0', () => {
    const bad = exec(['size', '--max', '2', 'src']);
    expect([bad.code, bad.err]).toEqual([1, ['src/a.ts: 3 lignes (max 2)']]);
    expect(exec(['size', 'src']).code).toBe(0);
  });

  it('design et images', () => {
    expect(exec(['design', 'src'])).toMatchObject({ code: 0, out: ['design : OK (2 fichiers)'] });
    expect(exec(['images', 'src']).code).toBe(0);
  });

  it('layers sans couches -> 2, avec couches en configuration -> 0', () => {
    expect(exec(['layers']).code).toBe(2);
    const layers = { layers: [{ name: 'a', paths: ['src'] }], roots: ['src'] };
    expect(exec(['layers'], conf({ layers })).code).toBe(0);
  });

  it('tokens par drapeaux et positionnels', () => {
    expect(exec(['tokens', '--tokens', 'tokens.json', 'src'])).toMatchObject({ code: 0, out: [] });
  });

  it('tokens : référence inconnue -> 1', () => {
    const { code, err } = exec(['tokens', '--tokens', 'tokens.json', 'src'], {
      'src/bad.css': 'p { color: var(--pp-zz); }\n',
    });
    expect([code, err]).toEqual([1, ['src/bad.css:1: token inconnu --pp-zz']]);
  });

  it('tokens par configuration', () => {
    expect(exec(['tokens'], conf({ tokens: tokensSection })).code).toBe(0);
  });

  it('tokens sans --tokens ni racine -> 2', () => {
    expect(exec(['tokens', 'src']).code).toBe(2);
    expect(exec(['tokens', '--tokens', 'tokens.json']).code).toBe(2);
  });
});

describe('configuration', () => {
  const implicit = conf({ size: { max: 2, roots: ['src'] } });

  it('implicite : la section remplace les défauts, les drapeaux la remplacent', () => {
    expect(exec(['size'], implicit).code).toBe(1);
    expect(exec(['size', '--max', '9'], implicit).code).toBe(0);
  });

  it('explicite : --config', () => {
    const extra = conf({ size: { max: 2 } }, 'custom.json');
    expect(exec(['size', '--config', 'custom.json'], extra).code).toBe(1);
  });

  it('--config absent -> 2 ; JSON invalide -> 2', () => {
    expect(exec(['size', '--config', 'nope.json']).code).toBe(2);
    expect(exec(['size'], { 'pp-guards.config.json': '{' }).code).toBe(2);
  });
});

describe('all', () => {
  const sections = { tokens: tokensSection, size: { roots: ['src'] } };

  it('lance les sections présentes', () => {
    const { code, out } = exec(['all'], conf(sections));
    expect([code, out]).toEqual([0, ['size : OK (2 fichiers)']]);
  });

  it('retourne le code le plus élevé', () => {
    const data = { ...sections, size: { max: 2, roots: ['src'] }, layers: {} };
    const { code, err } = exec(['all', '--config', 'c.json'], conf(data, 'c.json'));
    expect(code).toBe(2);
    expect(err).toContain('src/a.ts: 3 lignes (max 2)');
  });

  it('sans section -> 2', () => {
    expect(exec(['all']).code).toBe(2);
    expect(exec(['all'], conf({})).code).toBe(2);
  });

  it('--help -> 0', () => {
    expect(exec(['all', '--help']).code).toBe(0);
  });
});
