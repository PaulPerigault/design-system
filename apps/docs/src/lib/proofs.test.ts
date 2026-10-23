import { describe, expect, it } from 'vitest';
import raw from '../data/proofs.json';
import { formatCount, formatDate, loadProofs } from './proofs.ts';

type Tree = { [key: string]: unknown };

/** Copie du JSON réel dont le champ `path` (« a.b.c ») est remplacé, ou supprimé si `undefined`. */
function patched(path: string, value: unknown): Tree {
  const copy = structuredClone(raw) as Tree;
  const keys = path.split('.');
  const last = keys.pop() ?? '';
  const parent = keys.reduce<Tree>((node, key) => node[key] as Tree, copy);
  if (value === undefined) Reflect.deleteProperty(parent, last);
  else parent[last] = value;
  return copy;
}

describe('loadProofs', () => {
  it('accepte le fichier du dépôt', () => {
    expect(loadProofs(raw).tests.unit).toBe(raw.tests.unit);
  });

  it('refuse un champ manquant et le nomme', () => {
    expect(() => loadProofs(patched('tests.e2e', undefined))).toThrow(/proofs\.tests\.e2e/);
  });

  it('refuse un nombre négatif ou nul là où un nombre positif est attendu', () => {
    expect(() => loadProofs(patched('tests.unit', 0))).toThrow(/proofs\.tests\.unit/);
    expect(() => loadProofs(patched('tests.unit', -3))).toThrow(/proofs\.tests\.unit/);
  });

  it('admet zéro pour les violations axe et les ressources tierces', () => {
    expect(() => loadProofs(patched('accessibility.axeViolations', 0))).not.toThrow();
    expect(() => loadProofs(patched('security.thirdPartyAtRuntime', 0))).not.toThrow();
    expect(() => loadProofs(patched('accessibility.axeViolations', -1))).toThrow(/axeViolations/);
  });

  it('refuse une date qui n’est pas au format ISO', () => {
    expect(() => loadProofs(patched('measuredOn', '23/10/2026'))).toThrow(/measuredOn/);
    expect(() => loadProofs(patched('measuredOn', '2026-13-45'))).toThrow(/measuredOn/);
  });

  it('refuse un texte vide, une valeur non numérique et une entrée qui n’est pas un objet', () => {
    expect(() => loadProofs(patched('source', ' '))).toThrow(/proofs\.source/);
    expect(() => loadProofs(patched('performance.budgets.cls', '0.1'))).toThrow(/budgets\.cls/);
    expect(() => loadProofs(null)).toThrow(/objet attendu/);
  });

  it('refuse une répartition de contraste vide ou invalide', () => {
    const path = 'accessibility.contrastMinimums';
    expect(() => loadProofs(patched(path, {}))).toThrow(/contrastMinimums/);
    expect(() => loadProofs(patched(path, { '3:1': 'x' }))).toThrow(/contrastMinimums/);
  });
});

describe('formatCount', () => {
  it('sépare les milliers par une espace fine insécable', () => {
    expect(formatCount(1331)).toBe('1\u202f331');
    expect(formatCount(1_000_000)).toBe('1\u202f000\u202f000');
  });

  it('garde la valeur exacte, virgule décimale comprise', () => {
    expect(formatCount(0.1)).toBe('0,1');
    expect(formatCount(13)).toBe('13');
    expect(formatCount(0)).toBe('0');
  });
});

describe('formatDate', () => {
  it('écrit la date en toutes lettres, sans décalage de fuseau', () => {
    expect(formatDate('2026-10-23')).toBe('23 octobre 2026');
    expect(formatDate('2026-01-01')).toBe('1 janvier 2026');
  });
});
