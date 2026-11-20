// Couleurs des jetons du thème courant, résolues en sRGB par le navigateur (sonde `color`, puis
// lecture d'un pixel) : `getPropertyValue` rendrait le texte brut `light-dark(…)`.
import type { Page } from '@playwright/test';
import type { Rgb } from './pixels.ts';

export const TOKENS = {
  bg: '--pp-color-bg',
  accent: '--pp-color-accent',
  muted: '--pp-color-muted',
  fg: '--pp-color-fg',
  surface: '--pp-color-surface',
} as const;

export type TokenColors = Record<keyof typeof TOKENS, Rgb>;

export async function resolveTokens(page: Page): Promise<TokenColors> {
  const resolved = await page.evaluate((tokens) => {
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const host = document.querySelector('[data-milestones-demo] .pp-milestones') ?? document.body;
    const read = (token: string): number[] => {
      const probe = document.createElement('i');
      probe.style.color = `var(${token})`;
      host.append(probe);
      const css = getComputedStyle(probe).color;
      probe.remove();
      if (!ctx) return [0, 0, 0];
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    return Object.fromEntries(Object.entries(tokens).map(([key, token]) => [key, read(token)]));
  }, TOKENS);
  const rgb = (key: keyof typeof TOKENS): Rgb => {
    const [r = 0, g = 0, b = 0] = resolved[key] ?? [];
    return [r, g, b];
  };
  return {
    bg: rgb('bg'),
    accent: rgb('accent'),
    muted: rgb('muted'),
    fg: rgb('fg'),
    surface: rgb('surface'),
  };
}
