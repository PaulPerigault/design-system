import { expect, it } from 'vitest';
import { themeToArray } from '../src/raw-theme.ts';
import { codeOf, glue, ids, many, theme, whenBuilt } from './wasm-support.ts';

whenBuilt('.wasm construit : validation', () => {
  it('les codes du .wasm sont ceux de l’enveloppe', async () => {
    const { checkInput } = await glue();
    const ok = themeToArray(theme);
    const none = new Uint8Array(1);
    const bad = (patch: (a: Float32Array) => void) => () => {
      const copy = Float32Array.from(ok);
      patch(copy);
      checkInput(['a'], ['achieved'], Uint8Array.of(0), false, copy);
    };
    const cases: [string, () => void][] = [
      ['milestone-count', () => checkInput([], [], new Uint8Array(0), false, ok)],
      [
        'milestone-count',
        () =>
          checkInput(
            ids(25),
            many(25, () => 'planned'),
            new Uint8Array(25),
            false,
            ok,
          ),
      ],
      ['invalid-id', () => checkInput(['A'], ['planned'], none, false, ok)],
      [
        'duplicate-id',
        () => checkInput(['a', 'a'], ['planned', 'planned'], new Uint8Array(2), false, ok),
      ],
      ['unknown-status', () => checkInput(['a'], ['done'], none, false, ok)],
      ['length-mismatch', () => checkInput(['a', 'b'], ['planned'], new Uint8Array(2), false, ok)],
      ['theme-length', () => checkInput(['a'], ['planned'], none, false, new Float32Array(3))],
      ['theme-value', bad((a) => void (a[28] = Number.NaN))],
      ['theme-color', bad((a) => void (a[0] = 7))],
      ['theme-color', bad((a) => void (a[2] = -1))],
      ['accepté', () => checkInput(['a'], ['planned'], none, false, ok)],
    ];
    for (const [expected, run] of cases) expect(codeOf(run), expected).toBe(expected);
  });

  it('accepte tout ce que la validation TypeScript accepte (1 à 24 jalons, avec badges)', async () => {
    const { checkInput } = await glue();
    for (const count of [1, 9, 24]) {
      const badges = Uint8Array.from({ length: count }, (_, i) => i % 2);
      expect(
        codeOf(() =>
          checkInput(
            ids(count),
            many(count, (i) => (i % 2 === 1 ? 'achieved' : 'planned')),
            badges,
            true,
            themeToArray(theme),
          ),
        ),
      ).toBe('accepté');
    }
  });
});
