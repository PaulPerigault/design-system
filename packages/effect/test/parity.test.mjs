// Parité : la validation Schema accepte et refuse les mêmes entrées que le cœur (tokens/customize).
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { parseBuildInput as core } from '../../tokens/src/customize/index.ts';
import { parseBuildInput as option } from '../src/index.ts';

const VECTORS = [
  {},
  { accentHue: 270.7 },
  { accentHue: '120' },
  { accentHue: 0 },
  { accentHue: 360 },
  { accentHue: 361 },
  { accentHue: -1 },
  { accentHue: 'rouge' },
  { accentHue: '' },
  { accentHue: Number.NaN },
  { fontStack: 'system-ui, sans-serif' },
  { fontStack: '  "Atkinson Hyperlegible", sans-serif  ' },
  { fontStack: '' },
  { fontStack: 'a; b' },
  { fontStack: 'a } body { x' },
  { fontStack: 'url(https://exemple.test/f.woff)' },
  { fontStack: '@import "x"' },
  { fontStack: '"a, sans-serif' },
  { fontStack: 'fonction(' },
  { fontStack: 'x'.repeat(257) },
  { fontStack: 'x'.repeat(256) },
  { accentHue: 200, fontStack: 'serif' },
  { accentHue: 999, fontStack: 'serif' },
];

describe('parité Schema et cœur', () => {
  it.each(VECTORS.map((vector) => [JSON.stringify(vector), vector]))(
    'même verdict pour %s',
    async (_label, vector) => {
      const expected = core(vector).ok;
      const exit = await Effect.runPromiseExit(option(vector));
      expect(exit._tag === 'Success').toBe(expected);
    },
  );
  it('rend les valeurs nettoyées comme le cœur', async () => {
    const value = await Effect.runPromise(option({ accentHue: '120', fontStack: '  serif ' }));
    expect(value).toEqual({ accentHue: 120, fontStack: 'serif' });
  });
});
