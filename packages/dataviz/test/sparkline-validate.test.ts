import { describe, expect, it } from 'vitest';
import { MAX_POINTS } from '../src/domain/dataset.ts';
import type { SparklineInput } from '../src/domain/sparkline/validate.ts';
import { validateSparkline } from '../src/domain/sparkline/validate.ts';

const base: SparklineInput = { values: [1, 2, 3], width: 120, height: 32 };
const codeOf = (input: SparklineInput): string | undefined => {
  const result = validateSparkline(input);
  return result.ok ? undefined : result.error.code;
};

describe('validation de sparkline', () => {
  it('accepte une entrée valide : abscisses par défaut = indices, marge par défaut', () => {
    const result = validateSparkline(base);
    expect(result.ok && result.value).toMatchObject({ xs: [0, 1, 2], padding: 2 });
  });

  it.each([
    ['aucune valeur', { ...base, values: [] }, 'sparkline.no-data'],
    ['que des trous', { ...base, values: [null, null] }, 'sparkline.no-data'],
    ['largeur nulle', { ...base, width: 0 }, 'sparkline.bad-size'],
    ['hauteur non finie', { ...base, height: Number.NaN }, 'sparkline.bad-size'],
    ['marge négative', { ...base, padding: -1 }, 'sparkline.bad-size'],
    ['marge trop grande', { ...base, padding: 16 }, 'sparkline.bad-size'],
    ['valeur non finie', { ...base, values: [1, Number.NaN] }, 'dataset.non-finite'],
    ['abscisses de longueur différente', { ...base, xs: [0, 1] }, 'dataset.length-mismatch'],
    ['abscisses non croissantes', { ...base, xs: [0, 2, 2] }, 'geometry.bad-input'],
    ['abscisse non finie', { ...base, xs: [0, 1, Infinity] }, 'geometry.bad-input'],
  ])('%s → %s', (_name, input, code) => {
    expect(codeOf(input)).toBe(code);
  });

  it('refuse trop de points', () => {
    const values = Array.from({ length: MAX_POINTS + 1 }, () => 1);
    expect(codeOf({ ...base, values })).toBe('dataset.too-many-points');
  });
});
