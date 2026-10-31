import { describe, expect, it } from 'vitest';
import { OUT, run } from './build.mjs';
import { buildVectors } from './vectors.mjs';

describe('vecteurs de parité de pp-data', () => {
  const vectors = buildVectors();

  it('couvrent les erreurs de chaque contrat et les trous', () => {
    const errors = [...vectors.quantiles, ...vectors.lttb, ...vectors.aggregates].map(
      ({ error }) => error,
    );
    for (const code of [
      'stats.empty',
      'stats.non-finite',
      'stats.bad-probability',
      'geometry.bad-input',
      'downsample.bad-target',
      'dataset.bad-date',
      'dataset.non-finite',
      'dataset.length-mismatch',
      'dataset.empty',
    ]) {
      expect(errors, code).toContain(code);
    }
    const gapped = vectors.lttb.filter(({ values }) => values.includes(null));
    expect(gapped.length).toBeGreaterThanOrEqual(3);
  });

  it('sont déterministes', () => {
    expect(JSON.stringify(buildVectors())).toBe(JSON.stringify(vectors));
  });

  it(`${OUT} est à jour par rapport au TypeScript`, async () => {
    expect(await run(process.cwd(), { check: true })).toBe(0);
  });
});
