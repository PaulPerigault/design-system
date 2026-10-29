import { describe, expect, it } from 'vitest';
import { validateLayers } from '../src/domain/layers/layers.ts';
import { GuardUsageError } from '../src/errors.ts';

const one = (extra: Record<string, unknown> = {}) => [{ name: 'a', paths: ['x'], ...extra }];

describe('validateLayers', () => {
  it.each([
    ['absent', undefined],
    ['vide', []],
    ['nom en double', [...one(), ...one({ paths: ['y'] })]],
    ['sans paths', one({ paths: undefined })],
    ['paths vide', one({ paths: [] })],
    ['sans nom', one({ name: undefined })],
    ['packages invalide', one({ packages: 'p' })],
    ['couche non objet', ['a']],
  ])('refuse %s', (_label, value) => {
    expect(() => validateLayers(value)).toThrow(GuardUsageError);
  });

  it('normalise les chemins et complète packages', () => {
    const [layer] = validateLayers(one({ paths: ['./x/y/'] }));
    expect(layer).toEqual({ name: 'a', paths: ['x/y'], packages: [] });
  });
});
