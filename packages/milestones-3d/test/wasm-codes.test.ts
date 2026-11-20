import { expect, it } from 'vitest';
import { themeToArray } from '../src/raw-theme.ts';
import { EMBLEM_KEYS } from '../src/types.ts';
import { codeOf, glue, ids, many, theme, whenBuilt } from './wasm-support.ts';

whenBuilt('.wasm construit : validation', () => {
  it('les codes du .wasm sont ceux de l’enveloppe', async () => {
    const { checkInput } = await glue();
    const ok = themeToArray(theme);
    const bad = (patch: (a: Float32Array) => void) => () => {
      const copy = Float32Array.from(ok);
      patch(copy);
      checkInput(['a'], ['achieved'], [''], false, copy);
    };
    const cases: [string, () => void][] = [
      ['milestone-count', () => checkInput([], [], [], false, ok)],
      [
        'milestone-count',
        () =>
          checkInput(
            ids(25),
            many(25, () => 'planned'),
            many(25, () => ''),
            false,
            ok,
          ),
      ],
      ['invalid-id', () => checkInput(['A'], ['planned'], [''], false, ok)],
      ['duplicate-id', () => checkInput(['a', 'a'], ['planned', 'planned'], ['', ''], false, ok)],
      ['unknown-status', () => checkInput(['a'], ['done'], [''], false, ok)],
      ['unknown-emblem', () => checkInput(['a'], ['planned'], ['star'], false, ok)],
      ['length-mismatch', () => checkInput(['a', 'b'], ['planned'], ['', ''], false, ok)],
      ['theme-length', () => checkInput(['a'], ['planned'], [''], false, new Float32Array(3))],
      ['theme-value', bad((a) => void (a[24] = Number.NaN))],
      ['theme-color', bad((a) => void (a[0] = 7))],
      ['theme-color', bad((a) => void (a[2] = -1))],
      ['accepté', () => checkInput(['a'], ['planned'], [''], false, ok)],
    ];
    for (const [expected, run] of cases) expect(codeOf(run), expected).toBe(expected);
  });

  it('accepte tout ce que la validation TypeScript accepte (1 à 24 jalons, les neuf emblèmes)', async () => {
    const { checkInput } = await glue();
    for (const count of [1, 9, 24]) {
      const emblems = Array.from(
        { length: count },
        (_, i) => EMBLEM_KEYS[i % EMBLEM_KEYS.length] ?? '',
      );
      expect(
        codeOf(() =>
          checkInput(
            ids(count),
            many(count, () => 'achieved'),
            emblems,
            true,
            themeToArray(theme),
          ),
        ),
      ).toBe('accepté');
    }
  });
});
