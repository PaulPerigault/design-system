import { describe, expect, it } from 'vitest';
import { deriveOverrides } from '../../src/customize/derive-overrides.ts';
import { deriveRoles } from '../../src/customize/derive-roles.ts';
import { parseOklch } from '../../src/lib/color.ts';
import { contrastRatio } from '../../src/lib/contrast.ts';
import { DEFAULT_HUE, readSource, sourceOf, TWELVE_HUES } from './helpers.ts';
import { readRolePairs } from './role-pairs.ts';

const THEMES = ['light', 'dark'] as const;
const FOCUS = '--pp-color-focus';
const RUNNING = '--pp-color-status-running';

function derived(hue: number, theme: 'light' | 'dark') {
  const result = deriveRoles(hue, theme, sourceOf(theme));
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

describe('deriveRoles', () => {
  it.each(THEMES.flatMap((theme) => [DEFAULT_HUE, ...TWELVE_HUES].map((hue) => ({ theme, hue }))))(
    '$theme, teinte $hue : teinte suivie, contrastes de roles.json tenus',
    ({ theme, hue }) => {
      const roles = derived(hue, theme);
      const source = sourceOf(theme);
      for (const [token, role] of [
        [FOCUS, 'color.focus'],
        [RUNNING, 'color.status.running'],
      ]) {
        const color = parseOklch(roles[token ?? ''] ?? '');
        expect(color.h).toBeCloseTo(hue, 6);
        for (const { bg, min } of readRolePairs(role ?? '')) {
          const ground = bg === 'color.bg' ? source.bg : source.surface;
          expect(contrastRatio(color, ground)).toBeGreaterThanOrEqual(min);
        }
      }
    },
  );

  it('la teinte 360 est écrite comme 0 par la dérivation complète, comme l’accent', () => {
    const at = (hue: number) => {
      const result = deriveOverrides(hue, { light: sourceOf('light'), dark: sourceOf('dark') });
      if (!result.ok) throw new Error(result.error.message);
      return result.value.light;
    };
    expect(at(360)[FOCUS]).toBe(at(0)[FOCUS]);
    expect(at(360)[RUNNING]).toBe(at(0)['--pp-color-accent']);
  });

  it('seuils de roles.json : focus 3:1, statut 4,5:1, contre fond et surface', () => {
    const mins = (role: string) => readRolePairs(role).map(({ bg, min }) => `${bg}:${min}`);
    expect(mins('color.focus')).toEqual(['color.bg:3', 'color.surface:3']);
    expect(mins('color.status.running')).toEqual(['color.bg:4.5', 'color.surface:4.5']);
  });

  it('refuse un focus trop pâle, avec teinte, thème et rapport mesuré', () => {
    const pale = { ...sourceOf('light'), focus: { l: 0.9, c: 0.05, h: 0 } };
    const result = deriveRoles(145, 'light', pale);
    expect(result).toMatchObject({ ok: false, error: { code: 'build.role-contrast-failed' } });
    const message = result.ok ? '' : result.error.message;
    expect(message).toContain('Teinte 145, thème light');
    expect(message).toMatch(/--pp-color-focus à \d\.\d{2}:1 sur le fond, 3:1/);
    expect(message).not.toContain(RUNNING);
  });

  it('refuse un statut sous 4,5:1 sur la surface seule', () => {
    const near = sourceOf('dark').surface;
    const result = deriveRoles(145, 'dark', { ...sourceOf('dark'), surface: { ...near, l: 0.7 } });
    expect(result).toMatchObject({ ok: false, error: { code: 'build.role-contrast-failed' } });
    expect(result.ok ? '' : result.error.message).toContain('sur la surface, 4.5:1');
  });

  it('les jetons du défaut valent leur dérivation à la teinte par défaut', () => {
    expect(readSource('light.tokens.json')).toContain('"components": [0.47, 0.19, 270.7]');
    expect(derived(DEFAULT_HUE, 'light')[FOCUS]).toBe('oklch(47% 0.19 270.7)');
  });
});
