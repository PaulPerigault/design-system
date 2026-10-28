import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { derivePalettes, themeBaseFromTokens } from '../src/index.ts';

const tokens: unknown = JSON.parse(
  readFileSync(new URL('../../tokens/generated/tokens.json', import.meta.url), 'utf8'),
);
const CHROMA_TOLERANCE = 1e-3;
const HUE_TOLERANCE = 0.1;
const OKLCH = /^oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)$/;
const PERCENT = 100;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function committed(theme: 'light' | 'dark', index: number): number[] {
  const themes = isRecord(tokens) ? tokens['themes'] : undefined;
  const palette = isRecord(themes) ? themes[theme] : undefined;
  const entry = isRecord(palette) ? palette[`--pp-chart-${index}`] : undefined;
  const text = isRecord(entry) && typeof entry['oklch'] === 'string' ? entry['oklch'] : '';
  return (OKLCH.exec(text) ?? []).slice(1).map(Number);
}

describe('jetons --pp-chart-* de tokens.json', () => {
  it.each(['light', 'dark'] as const)(
    'thème %s : les 6 couleurs sont celles que dérive derivePalettes (accent par défaut)',
    (theme) => {
      const base = themeBaseFromTokens(tokens, theme);
      if (!base.ok) throw new Error(base.error.message);
      const palettes = derivePalettes(base.value.accent.h, theme, base.value);
      if (!palettes.ok) throw new Error(palettes.error.message);
      palettes.value.categorical.forEach((color, i) => {
        const [l, c, h] = committed(theme, i + 1);
        expect((l ?? 0) / PERCENT).toBeCloseTo(color.l, 2);
        expect(Math.abs((c ?? 0) - color.c)).toBeLessThan(CHROMA_TOLERANCE);
        expect(Math.abs((h ?? 0) - color.h)).toBeLessThan(HUE_TOLERANCE);
      });
    },
  );
});
