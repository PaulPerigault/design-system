import { describe, expect, it } from 'vitest';
import { extremesOf } from '../src/domain/sparkline/extremes.ts';

describe('extrêmes', () => {
  it('minimum et maximum avec leur indice, trous ignorés', () => {
    expect(extremesOf([3, null, 9, -2, 5])).toEqual({
      min: { index: 3, value: -2 },
      max: { index: 2, value: 9 },
    });
  });

  it('première occurrence en cas d’égalité', () => {
    expect(extremesOf([4, 4, 4])).toEqual({
      min: { index: 0, value: 4 },
      max: { index: 0, value: 4 },
    });
  });

  it('null sans valeur', () => {
    expect(extremesOf([])).toBeNull();
    expect(extremesOf([null, null])).toBeNull();
  });
});
