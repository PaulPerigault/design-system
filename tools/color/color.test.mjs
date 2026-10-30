import { describe, expect, it } from 'vitest';
import { OUT, run, same } from './build.mjs';
import { buildVectors } from './vectors.mjs';
import { readFileSync } from 'node:fs';

describe('same', () => {
  it('tolère un écart de dernier bit, pas davantage', () => {
    expect(same({ a: [1, 0.3] }, { a: [1 + 1e-15, 0.3] })).toBe(true);
    expect(same({ a: 1 }, { a: 1 + 1e-9 })).toBe(false);
  });

  it('exige les mêmes clés, les mêmes types et les mêmes textes', () => {
    expect(same({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(same({ hex: '#000000' }, { hex: '#000001' })).toBe(false);
    expect(same({ hex: null }, { hex: '#000000' })).toBe(false);
  });
});

describe('vecteurs de parité', () => {
  const read = (path) => readFileSync(path, 'utf8');
  const vectors = buildVectors(read);

  it('couvrent le noir, le blanc, le chroma nul, le hors gamut et les teintes de 30°', () => {
    const names = vectors.colors.map(({ name }) => name);
    for (const name of ['noir', 'blanc', 'hors gamut', 'teinte 330° dark', 'bord 0°']) {
      expect(names, name).toContain(name);
    }
    expect(names.some((name) => name.startsWith('chroma nul'))).toBe(true);
    expect(vectors.contrasts.some(({ error }) => error === 'out-of-gamut')).toBe(true);
  });

  it('sont déterministes', () => {
    expect(JSON.stringify(buildVectors(read))).toBe(JSON.stringify(vectors));
  });

  it(`${OUT} est à jour par rapport au TypeScript`, async () => {
    expect(await run(process.cwd(), { check: true })).toBe(0);
  });
});
