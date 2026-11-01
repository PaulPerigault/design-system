import { describe, expect, it } from 'vitest';
import { collect, isMeasured, report } from './check-duplication.mjs';
import { measure, significant } from './duplication.mjs';

const BLOCK = ['a();', 'b();', 'c();', 'd();', 'e();', 'f();'].join('\n');

describe('significant', () => {
  it('ignore lignes vides, commentaires et espaces de marge', () => {
    const lines = significant('// note\n\n  const  x = 1;\n/* c */\n');
    expect(lines).toEqual([{ line: 3, text: 'const x = 1;' }]);
  });
});

describe('measure', () => {
  it('trouve un bloc copié dans deux fichiers', () => {
    const files = new Map([
      ['a.ts', `x();\n${BLOCK}\n`],
      ['b.ts', `${BLOCK}\ny();\n`],
    ]);
    const result = measure(files);
    expect(result.duplicated).toBe(12);
    expect(result.total).toBe(14);
    expect(result.blocks.map((b) => [b.file, b.from, b.to])).toEqual([
      ['a.ts', 2, 7],
      ['b.ts', 1, 6],
    ]);
  });

  it('ne signale rien sous la taille minimale ni sans copie', () => {
    const files = new Map([
      ['a.ts', 'a();\nb();\n'],
      ['b.ts', 'a();\nb();\n'],
    ]);
    expect(measure(files).blocks).toEqual([]);
    expect(measure(new Map()).rate).toBe(0);
  });
});

describe('collecte et rapport', () => {
  it('exclut tests, générés et wasm', () => {
    expect(isMeasured('packages/x/src/a.ts')).toBe(true);
    expect(isMeasured('packages/x/test/a.ts')).toBe(false);
    expect(isMeasured('packages/x/src/a.test.ts')).toBe(false);
    expect(isMeasured('packages/x/wasm/a.ts')).toBe(false);
  });

  it('collecte les fichiers du dépôt et formate le taux', () => {
    expect(collect().size).toBeGreaterThan(0);
    const text = report({ total: 200, duplicated: 3, rate: 0.015, blocks: [] });
    expect(text).toContain('1,50 %');
  });
});
