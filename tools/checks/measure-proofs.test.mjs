import { describe, expect, it } from 'vitest';
import * as core from './proofs-core.mjs';
import { measure } from './measure-proofs.mjs';

describe('analyseurs', () => {
  it('lit les tests Vitest malgré le bruit avant le JSON', () => {
    expect(core.unitTests('WARN x\n{"numTotalTests": 12}')).toBe(12);
    expect(() => core.unitTests('rien')).toThrow(/Vitest/);
  });
  it('lit les tests e2e déclarés et les attestations', () => {
    expect(core.e2eDeclared('Listing tests:\nTotal: 9406 tests in 39 files')).toBe(9406);
    expect(core.attestations('209 packages have verified attestations')).toBe(209);
    expect(() => core.attestations('')).toThrow(/attestations/);
  });
  it('compte pages, composants et termes', () => {
    const files = [
      'index.html',
      'a/index.html',
      'pagefind/x/index.html',
      'components/b/index.html',
    ];
    expect(core.pageCount(files)).toBe(3);
    expect(core.componentCount(files)).toBe(1);
    expect(core.glossaryTerms('<dt id="a">x</dt><dt>y</dt><dd>z</dd>')).toBe(2);
  });
  it('répartit les paires par seuil, du plus haut au plus bas', () => {
    const r = core.contrast([{ min: 3 }, { min: 7 }, { min: 3 }]);
    expect(r).toEqual({ pairs: 3, minimums: { '7:1': 1, '3:1': 2 } });
    expect(Object.keys(r.minimums)).toEqual(['7:1', '3:1']);
  });
});

describe('merge et measure', () => {
  const current = {
    measuredOn: '2020-01-01',
    tests: { unit: 1, e2e: 2, devices: 13, themes: 2 },
    content: { pages: 1, components: 1, registryItems: 1, glossaryTerms: 1 },
    accessibility: { target: 't', axeViolations: 0, contrastPairs: 1, contrastMinimums: {} },
    security: { csp: 'c', auditSignatures: 'x', installScripts: 'i', thirdPartyAtRuntime: 0 },
  };
  const io = {
    list: () => ['index.html', 'components/b/index.html', 'glossaire/index.html'],
    text: () => '<dt>a</dt>',
    json: (p) => (p.includes('registry') ? { items: [1, 2] } : { pairs: [{ min: 3 }] }),
    vitest: () => '{"numTotalTests": 5}',
    playwrightList: () => 'Total: 7 tests in 1 files',
    auditSignatures: () => '3 packages have verified attestations',
  };
  it('remplace les champs mesurés, garde les autres, supprime l’ancien champ e2e', () => {
    const next = core.merge(current, measure(io), '2026-11-04');
    expect(next.tests).toEqual({ unit: 5, e2eDeclared: 7, devices: 13, themes: 2 });
    expect(next.content).toEqual({ pages: 3, components: 1, registryItems: 2, glossaryTerms: 1 });
    expect(next.accessibility.axeViolations).toBe(0);
    expect(next.security.auditSignatures).toBe('3 paquets avec attestations vérifiées');
    expect(next.measuredOn).toBe('2026-11-04');
  });
});
