import { describe, expect, it } from 'vitest';
import { parseColor } from '../src/color.ts';
import { MilestonesError } from '../src/error.ts';
import type { ThemeColor } from '../src/types.ts';
import { SAMPLES } from './fixtures/samples.ts';

const near = (value: number | undefined, expected: number, digits = 5): void =>
  expect(value ?? Number.NaN).toBeCloseTo(expected, digits);

describe('couleurs calculées par de vrais moteurs', () => {
  for (const sample of SAMPLES) {
    describe(sample.version, () => {
      it('lit les six jetons du thème clair et du thème sombre en OKLCH', () => {
        for (const scheme of ['light', 'dark'] as const) {
          for (const [token, text] of Object.entries(sample.tokens[scheme])) {
            const color = parseColor(text);
            expect(color.space, `${scheme} ${token} : ${text}`).toBe('oklch');
          }
        }
      });

      it('rend l’accent clair tel que tokens.css le définit (oklch(47% 0.19 270.7))', () => {
        const color = parseColor(sample.tokens.light['accent'] ?? '');
        expect(color).toMatchObject({ space: 'oklch' });
        if (color.space !== 'oklch') return;
        // WebKit sérialise la teinte en simple précision : 270.700012.
        near(color.l, 0.47, 4);
        near(color.c, 0.19, 4);
        near(color.h, 270.7, 4);
      });

      it('lit les formes du moteur, ou refuse celles qu’il ne prend pas en charge', () => {
        for (const [written, computed] of Object.entries(sample.forms)) {
          try {
            parseColor(computed);
          } catch (error) {
            expect(error, `${written} => ${computed}`).toBeInstanceOf(MilestonesError);
            expect(error).toMatchObject({ code: 'unsupported-color' });
          }
        }
      });
    });
  }

  it('les trois moteurs s’accordent à 1e-3 près sur chaque jeton', () => {
    const [first, ...others] = SAMPLES;
    for (const other of others) {
      for (const scheme of ['light', 'dark'] as const) {
        for (const [token, text] of Object.entries(first?.tokens[scheme] ?? {})) {
          sameColor(parseColor(text), parseColor(other.tokens[scheme][token] ?? ''));
        }
      }
    }
  });
});

function sameColor(a: ThemeColor, b: ThemeColor): void {
  expect(a.space).toBe(b.space);
  if (a.space !== 'oklch' || b.space !== 'oklch') return;
  for (const [x, y] of [
    [a.l, b.l],
    [a.c, b.c],
    [a.h, b.h],
  ] as const) {
    expect(Math.abs(x - y)).toBeLessThan(1e-3);
  }
}
