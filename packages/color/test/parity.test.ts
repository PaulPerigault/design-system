// Parité du paquet construit (dist/ + .wasm) avec la référence TypeScript : mêmes vecteurs que
// crates/pp-color/tests/parity.rs (parity.json), mêmes seuils (ADR-0006, décision 4).
import { beforeAll, expect, it } from 'vitest';
import { loadBuilt, vectors, whenBuilt } from './support.ts';
import type { Api } from './support.ts';

const TOLERANCE = 1e-6;
const CENTI = 100;

const close = (actual: number, expected: number, tolerance = TOLERANCE): boolean =>
  Math.abs(actual - expected) <= tolerance;
const side = ({ hex, oklch: [l = 0, c = 0, h = 0] = [] }: { hex?: string; oklch?: number[] }) =>
  hex ?? { l, c, h };

whenBuilt('parité avec la référence TypeScript (parity.json)', () => {
  let api: Api;
  beforeAll(async () => {
    api = await loadBuilt();
  });

  it('conversions, gamut et ramenée dans le gamut', () => {
    const { colors } = vectors();
    expect(colors.length).toBeGreaterThanOrEqual(90);
    for (const {
      name,
      oklch: [l, c, h],
      srgb,
      linear,
      inGamut,
      fit,
    } of colors) {
      const color = { l, c, h };
      const actual = api.oklchToSrgb(color);
      expect(
        [actual.r, actual.g, actual.b].every((v, i) => close(v, srgb[i] ?? NaN)),
        name,
      ).toBe(true);
      const lin = api.oklchToLinearSrgb(color);
      expect(
        [lin.r, lin.g, lin.b].every((v, i) => close(v, linear[i] ?? NaN)),
        name,
      ).toBe(true);
      expect(api.inSrgbGamut(color), `${name} : gamut`).toBe(inGamut);
      const fitted = api.fitToGamut(color);
      expect(close(fitted.l, fit.l) && close(fitted.c, fit.c) && close(fitted.h, fit.h), name).toBe(
        true,
      );
    }
  });

  it('hexadécimal dans les deux sens, refus hors gamut', () => {
    const { colors, hexes } = vectors();
    for (const {
      name,
      oklch: [l, c, h],
      hex,
    } of colors) {
      if (hex === null) expect(() => api.toHex({ l, c, h }), name).toThrow(/out-of-gamut/);
      else expect(api.toHex({ l, c, h }), name).toBe(hex);
    }
    for (const { hex, oklch } of hexes) {
      const actual = api.hexToOklch(hex);
      expect(
        close(actual.l, oklch.l) && close(actual.c, oklch.c) && close(actual.h, oklch.h),
        hex,
      ).toBe(true);
    }
  });

  it('contraste WCAG 2 (rapport et arrondi) et APCA, refus hors gamut identiques', () => {
    const { contrasts } = vectors();
    expect(contrasts.length).toBeGreaterThanOrEqual(60);
    let refused = 0;
    for (const { name, fg, bg, ratio, centi, lc, error } of contrasts) {
      const [text, background] = [side(fg), side(bg)];
      if (error) {
        expect(() => api.contrastRatio(text, background), name).toThrow(/out-of-gamut/);
        refused += 1;
        continue;
      }
      const actual = api.contrastRatio(text, background);
      expect(close(actual, ratio ?? NaN), `${name} : ratio ${actual}`).toBe(true);
      expect(Math.round(actual * CENTI), `${name} : arrondi`).toBe(centi);
      expect(close(api.apcaLc(text, background), lc ?? NaN), `${name} : Lc`).toBe(true);
    }
    expect(refused, 'le refus hors gamut doit être testé').toBeGreaterThan(0);
  });
});
