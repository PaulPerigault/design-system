import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { STYLED_PAGES } from './helpers';

/** Durée CSS en millisecondes : le minifieur réécrit `160ms` en `.16s`. */
function toMs(value: string): string {
  const match = /^(-?[\d.]+)(ms|s)$/.exec(value.trim());
  if (!match) return value;
  const ms = Number(match[1]) * (match[2] === 's' ? 1000 : 1);
  return `${Math.round(ms)}ms`;
}

const readMotion = async (page: Page) => {
  const raw = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      duration: style.getPropertyValue('--pp-duration-base'),
      scrollBehavior: style.scrollBehavior,
    };
  });
  return { ...raw, duration: toMs(raw.duration) };
};

test.describe('mouvement réduit', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const path of STYLED_PAGES) {
    test(`durées nulles et défilement instantané : ${path}`, async ({ page }) => {
      await page.goto(path);
      const { duration, scrollBehavior } = await readMotion(page);
      expect(duration).toBe('0ms');
      expect(scrollBehavior).not.toBe('smooth');
    });
  }
});

test.describe('sans préférence de mouvement', () => {
  test.use({ reducedMotion: 'no-preference' });

  for (const path of STYLED_PAGES) {
    test(`durée de base à 160ms : ${path}`, async ({ page }) => {
      await page.goto(path);
      const { duration } = await readMotion(page);
      expect(duration).toBe('160ms');
    });
  }
});
