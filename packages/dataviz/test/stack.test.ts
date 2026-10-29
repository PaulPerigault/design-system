import { describe, expect, it } from 'vitest';
import type { Result } from '../src/domain/result.ts';
import { stackSeries } from '../src/domain/geometry/stack.ts';

const get = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};
const codeOf = (result: Result<unknown>): string | undefined =>
  result.ok ? undefined : result.error.code;

describe('stackSeries', () => {
  it('empile : chaque couche repose sur le cumul des précédentes', () => {
    const [a, b, c] = get(
      stackSeries([
        [1, 2],
        [3, 4],
        [5, 6],
      ]),
    );
    expect(a).toEqual({ lower: [0, 0], upper: [1, 2] });
    expect(b).toEqual({ lower: [1, 2], upper: [4, 6] });
    expect(c).toEqual({ lower: [4, 6], upper: [9, 12] });
  });

  it('décision : une valeur manquante compte pour zéro dans le cumul mais rompt sa couche', () => {
    const [a, b, c] = get(
      stackSeries([
        [1, 1, 1],
        [2, null, 2],
        [3, 3, 3],
      ]),
    );
    expect(b?.upper).toEqual([3, null, 3]);
    expect(b?.lower).toEqual([1, null, 1]);
    expect(a?.upper).toEqual([1, 1, 1]);
    // La couche du dessus descend sur celle d'en dessous, elle ne flotte pas au-dessus d'un vide.
    expect(c).toEqual({ lower: [3, 1, 3], upper: [6, 4, 6] });
  });

  it('accepte zéro, aucune série et des séries vides', () => {
    expect(get(stackSeries([[0, 0]]))[0]?.upper).toEqual([0, 0]);
    expect(get(stackSeries([]))).toEqual([]);
    expect(get(stackSeries([[], []]))).toHaveLength(2);
  });

  it('refuse une valeur négative avec le chemin de la couche fautive', () => {
    const result = stackSeries([
      [1, 2],
      [3, -4],
    ]);
    expect(codeOf(result)).toBe('stack.negative-value');
    expect(!result.ok && result.error.path).toBe('series[1].values[1]');
  });

  it('refuse des longueurs différentes et une valeur non finie', () => {
    expect(codeOf(stackSeries([[1], [1, 2]]))).toBe('geometry.bad-input');
    expect(codeOf(stackSeries([[1, Number.NaN]]))).toBe('geometry.bad-input');
  });
});
