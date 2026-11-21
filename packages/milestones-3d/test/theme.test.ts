import { describe, expect, it } from 'vitest';
import { FALLBACK_EASING, THEME_TOKENS } from '../src/constants.ts';
import { MilestonesError } from '../src/error.ts';
import type { ThemeProbe } from '../src/theme.ts';
import { readThemeWith } from '../src/theme.ts';
import { SAMPLES } from './fixtures/samples.ts';
import { probeFor } from './support-theme.ts';

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

  it('paper : --pp-color-bg lu en mode clair, quel que soit le thème de la page', () => {
    const [sample] = SAMPLES;
    if (!sample) throw new Error('aucun relevé');
    const asked: (string | undefined)[] = [];
    const { probe } = probeFor(sample, 'dark');
    const spy: ThemeProbe = {
      ...probe,
      color(token, scheme) {
        if (token === THEME_TOKENS.bg) asked.push(scheme);
        return probe.color(token, scheme);
      },
    };
    const dark = readThemeWith('r', () => spy);
    const light = readThemeWith('r', () => probeFor(sample, 'light').probe);
    expect(dark.colors.paper).toEqual(light.colors.bg);
    expect(dark.colors.paper).not.toEqual(dark.colors.bg);
    expect(asked).toEqual([undefined, 'light']); // bg suit la page, paper est clair
  });

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
