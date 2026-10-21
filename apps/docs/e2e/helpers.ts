import type { Page } from '@playwright/test';

/** Pages couvertes par les tests E2E. */
export const PAGES = ['/', '/identite/', '/components/stack/'] as const;

/** Pages qui chargent les tokens et la CSS du design system. */
export const STYLED_PAGES = ['/identite/', '/components/stack/'] as const;

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const VIEWPORTS = [
  { name: 'bureau', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
] as const;
export type Viewport = (typeof VIEWPORTS)[number];

/** Taille minimale d'une cible (WCAG 2.2, critère 2.5.8), en pixels CSS. */
export const TARGET_MIN = 24;

/** Pose `data-theme` sur `<html>` et attend la fin des transitions de couleur qu'il déclenche. */
export async function setTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate(async (value) => {
    document.documentElement.setAttribute('data-theme', value);
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
  }, theme);
}

/** Ouvre une page au viewport donné, thème appliqué. */
export async function open(page: Page, path: string, viewport: Viewport, theme?: Theme) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(path);
  if (theme) await setTheme(page, theme);
}
