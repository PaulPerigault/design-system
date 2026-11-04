import { describe, expect, it } from 'vitest';
import {
  internalDependencyProblems,
  satisfies,
  templateVersionProblems,
} from './internal-deps.mjs';

const pkg = (name, version, deps = {}, field = 'dependencies') => ({
  name: `@paulperigault/${name}`,
  version,
  [field]: Object.fromEntries(Object.entries(deps).map(([k, v]) => [`@paulperigault/${k}`, v])),
});

describe('satisfies', () => {
  it.each([
    ['0.1.0', '0.1.0', true],
    ['0.1.0', '0.1.1', false],
    ['^0.1.0', '0.1.4', true],
    ['^0.1.0', '0.2.0', false],
    ['^0.1.2', '0.1.1', false],
    ['^1.2.0', '1.9.0', true],
    ['^1.2.0', '2.0.0', false],
    ['^0.0.3', '0.0.4', false],
    ['~1.2.0', '1.2.9', true],
    ['~1.2.0', '1.3.0', false],
    ['*', '0.1.0', false],
    ['latest', '0.1.0', false],
  ])('%s sur %s : %s', (spec, version, expected) => {
    expect(satisfies(spec, version)).toBe(expected);
  });
});

describe('internalDependencyProblems', () => {
  it('accepte les versions réelles et l’état d’avant la première release', () => {
    const released = [pkg('tokens', '0.1.0'), pkg('css', '0.1.0', { tokens: '0.1.0' })];
    const initial = [pkg('tokens', '0.0.0'), pkg('css', '0.0.0', { tokens: '0.0.0' })];
    expect(internalDependencyProblems(released)).toEqual([]);
    expect(internalDependencyProblems(initial)).toEqual([]);
  });
  it('refuse l’amorce 0.0.0 quand le paquet voisin a avancé', () => {
    const list = [pkg('tokens', '0.1.0'), pkg('css', '0.1.0', { tokens: '0.0.0' })];
    const [problem] = internalDependencyProblems(list);
    expect(problem).toContain('@paulperigault/css (dependencies) : @paulperigault/tokens');
    expect(problem).toContain('amorce vide du registre, le paquet est en 0.1.0');
  });
  it.each(['*', 'latest'])('refuse « %s »', (spec) => {
    const list = [pkg('tokens', '0.1.0'), pkg('css', '0.1.0', { tokens: spec })];
    expect(internalDependencyProblems(list)[0]).toContain('aucune version précise');
  });
  it('refuse une version qui ne correspond pas et un paquet inconnu', () => {
    const list = [pkg('tokens', '0.2.0'), pkg('css', '0.1.0', { tokens: '0.1.0', ghost: '0.1.0' })];
    const problems = internalDependencyProblems(list);
    expect(problems[0]).toContain('0.1.0 ne satisfait pas la version 0.2.0');
    expect(problems[1]).toContain('absent du workspace');
  });
  it('lit les quatre champs de dépendances', () => {
    for (const field of ['devDependencies', 'peerDependencies', 'optionalDependencies']) {
      const list = [pkg('tokens', '0.1.0'), pkg('css', '0.1.0', { tokens: '*' }, field)];
      expect(internalDependencyProblems(list)[0]).toContain(`(${field})`);
    }
  });
  it('ignore les dépendances hors du périmètre @paulperigault', () => {
    const list = [{ name: '@paulperigault/css', version: '0.1.0', dependencies: { astro: '*' } }];
    expect(internalDependencyProblems(list)).toEqual([]);
  });
});

describe('templateVersionProblems', () => {
  const workspace = new Map([['@paulperigault/css', '0.1.0']]);
  it('accepte une version alignée et ignore les paquets tiers', () => {
    expect(
      templateVersionProblems({ '@paulperigault/css': '0.1.0', astro: '7.4.1' }, workspace),
    ).toEqual([]);
  });
  it('refuse la version d’amorce laissée dans le gabarit', () => {
    expect(templateVersionProblems({ '@paulperigault/css': '0.0.0' }, workspace)).toHaveLength(1);
  });
});
