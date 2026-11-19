import { describe, expect, it } from 'vitest';
import { BROTLI_TARGET, weightReport } from './report.ts';

const weight = (brotli) => ({ raw: brotli * 3, gzip: brotli + 100, brotli });
const measures = (after) => ({
  before: weight(40000),
  after: weight(after),
  glue: weight(5000),
  optimized: true,
});

describe('rapport de poids', () => {
  it('donne brut, gzip et brotli avant, après et pour la glue', () => {
    const text = weightReport(measures(28000)).join('\n');
    expect(text).toContain('| `.wasm` avant wasm-opt | 120000 | 40100 | 40000 |');
    expect(text).toContain('| `.wasm` après wasm-opt -Oz | 84000 | 28100 | 28000 |');
    expect(text).toContain('| glue JavaScript | 15000 | 5100 | 5000 |');
  });

  it('dit que la cible est tenue', () => {
    expect(weightReport(measures(28000)).at(-1)).toContain('sous la cible de 60.0 Kio');
  });

  it('écrit le dépassement sans le bloquer', () => {
    const line = weightReport(measures(BROTLI_TARGET + 1)).at(-1);
    expect(line).toContain('AU-DESSUS');
    expect(line).toContain('non bloquant');
  });

  it('dit quand wasm-opt n’a pas tourné', () => {
    const text = weightReport({ ...measures(28000), optimized: false }).join('\n');
    expect(text).toContain('wasm-opt non lancé');
  });
});
