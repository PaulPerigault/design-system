import { describe, expect, it } from 'vitest';
import { faultOf } from '../src/faults.ts';
import { flatten, unflatten } from '../src/pack.ts';

const code = (result: ReturnType<typeof faultOf>): string => (result.ok ? 'ok' : result.error.code);

describe('faultOf', () => {
  it('traduit une cause en code selon la fonction appelée', () => {
    expect(code(faultOf('quantiles', 'empty-input'))).toBe('stats.empty');
    expect(code(faultOf('aggregate', 'empty-input'))).toBe('dataset.empty');
    expect(code(faultOf('lttb', 'non-finite-abscissa'))).toBe('geometry.bad-input');
    expect(code(faultOf('lttb', 'bad-target'))).toBe('downsample.bad-target');
    expect(code(faultOf('aggregate', 'bad-date'))).toBe('dataset.bad-date');
  });
  it('rend data.internal pour une cause inconnue ou une valeur qui n’est pas un texte', () => {
    expect(code(faultOf('aggregate', 'bad-argument'))).toBe('data.internal');
    expect(code(faultOf('lttb', new Error('x')))).toBe('data.internal');
    expect(code(faultOf('quantiles', undefined))).toBe('data.internal');
  });
});

describe('pack', () => {
  it('met les séries à plat avec un masque, jamais NaN pour un manquant', () => {
    const { values, missing } = flatten([
      { id: 'a', label: 'A', unit: '', values: [1, null] },
      { id: 'b', label: 'B', unit: '', values: [null, 4] },
    ]);
    expect(Array.from(values)).toEqual([1, 0, 0, 4]);
    expect(Array.from(missing)).toEqual([0, 1, 1, 0]);
  });
  it('découpe le résultat du .wasm par série et rend null pour NaN', () => {
    expect(unflatten(Float64Array.of(1, Number.NaN, 3, 4), 2)).toEqual([
      [1, null],
      [3, 4],
    ]);
    expect(unflatten(new Float64Array(0), 0)).toEqual([]);
  });
});
