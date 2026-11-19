import { describe, expect, it, vi } from 'vitest';
import { FALLBACK_EASING, THEME_TOKENS } from '../src/constants.ts';
import { MilestonesError } from '../src/error.ts';
import { themeToArray } from '../src/raw-theme.ts';
import type { ThemeProbe } from '../src/theme.ts';
import { readThemeWith } from '../src/theme.ts';
import { SAMPLES } from './fixtures/samples.ts';
import type { EngineSample } from './fixtures/samples.ts';

const TOKEN_KEYS = new Map<string, string>([
  [THEME_TOKENS.bg, 'bg'],
  [THEME_TOKENS.fg, 'fg'],
  [THEME_TOKENS.accent, 'accent'],
  [THEME_TOKENS.onAccent, 'on-accent'],
  [THEME_TOKENS.line, 'line'],
  [THEME_TOKENS.muted, 'muted'],
]);

/** Sonde qui rejoue ce qu'un moteur a calculé, sans DOM. */
function probeFor(sample: EngineSample, scheme: 'light' | 'dark', raw = sample.raw) {
  const dispose = vi.fn();
  const probe: ThemeProbe = {
    color: (token) => sample.tokens[scheme][TOKEN_KEYS.get(token) ?? ''] ?? null,
    custom: (name) => raw[name] ?? '',
    dispose,
  };
  return { probe, dispose };
}

describe('readTheme avec les valeurs de trois moteurs réels', () => {
  for (const sample of SAMPLES) {
    for (const scheme of ['light', 'dark'] as const) {
      it(`${sample.version}, thème ${scheme}`, () => {
        const { probe, dispose } = probeFor(sample, scheme);
        const theme = readThemeWith('racine', () => probe);
        expect(theme.colors.accent.space).toBe('oklch');
        expect(theme.durationBase).toBe(160);
        expect(theme.durationFast).toBe(100);
        expect(theme.easing).toEqual([0.2, 0, 0, 1]);
        expect(dispose).toHaveBeenCalledOnce();
      });
    }
  }

  it('le thème clair et le thème sombre diffèrent', () => {
    const [sample] = SAMPLES;
    if (!sample) throw new Error('aucun relevé');
    const light = readThemeWith('r', () => probeFor(sample, 'light').probe);
    const dark = readThemeWith('r', () => probeFor(sample, 'dark').probe);
    expect(light.colors.bg).not.toEqual(dark.colors.bg);
  });
});

describe('jetons absents ou illisibles', () => {
  const [sample] = SAMPLES;
  if (!sample) throw new Error('aucun relevé');

  it('un jeton de couleur absent lève invalid-theme et libère la sonde', () => {
    const { probe, dispose } = probeFor(sample, 'light');
    const missing: ThemeProbe = {
      ...probe,
      color: (t) => (t === THEME_TOKENS.line ? null : probe.color(t)),
    };
    expect(() => readThemeWith('r', () => missing)).toThrow(/invalid-theme.*--pp-color-line/);
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('une couleur dans un format non pris en charge lève unsupported-color', () => {
    const { probe } = probeFor(sample, 'light');
    const odd: ThemeProbe = { ...probe, color: () => 'color(display-p3 0.2 0.4 0.6)' };
    expect(() => readThemeWith('r', () => odd)).toThrow(MilestonesError);
    expect(() => readThemeWith('r', () => odd)).toThrow(/unsupported-color/);
  });

  it('durées illisibles : 0 ms, courbe non reconnue : linéaire', () => {
    const { probe } = probeFor(sample, 'light', {});
    const theme = readThemeWith('r', () => probe);
    expect(theme.durationBase).toBe(0);
    expect(theme.durationFast).toBe(0);
    expect(theme.easing).toEqual(FALLBACK_EASING);
  });

  it('mouvement réduit : les durées 0ms du jeton sont lues telles quelles', () => {
    const raw = {
      ...sample.raw,
      [THEME_TOKENS.durationBase]: '0ms',
      [THEME_TOKENS.durationFast]: '0ms',
    };
    const theme = readThemeWith('r', () => probeFor(sample, 'light', raw).probe);
    expect([theme.durationBase, theme.durationFast]).toEqual([0, 0]);
  });
});

describe('thème pour le .wasm', () => {
  it('30 nombres : six couleurs de quatre, deux durées, quatre points de contrôle', () => {
    const [sample] = SAMPLES;
    if (!sample) throw new Error('aucun relevé');
    const array = themeToArray(readThemeWith('r', () => probeFor(sample, 'light').probe));
    expect(array).toHaveLength(30);
    expect(Array.from(array.slice(0, 4))).toEqual([
      1,
      expect.closeTo(0.985, 5),
      expect.closeTo(0.004, 5),
      expect.closeTo(270.7, 3),
    ]);
    expect(Array.from(array.slice(24))).toEqual([160, 100, expect.closeTo(0.2, 5), 0, 0, 1]);
  });

  it('une couleur sRGB porte l’étiquette d’espace 0', () => {
    const [sample] = SAMPLES;
    if (!sample) throw new Error('aucun relevé');
    const base = readThemeWith('r', () => probeFor(sample, 'light').probe);
    const array = themeToArray({
      ...base,
      colors: { ...base.colors, bg: { space: 'srgb', r: 1, g: 0.5, b: 0 } },
    });
    expect(Array.from(array.slice(0, 4))).toEqual([0, 1, 0.5, 0]);
  });
});
