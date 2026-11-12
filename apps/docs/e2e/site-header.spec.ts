import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const NARROW = { width: 360, height: 640 };
const WIDE = { width: 1440, height: 900 };
const HEADER = '.docs-main .pp-site-header';
const FOOTER = '.docs-main .pp-site-footer';

const top = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => Math.round(el.getBoundingClientRect().top));

test('en-tête étroit : navigation sous la signature, action masquée', async ({ page }) => {
  await page.setViewportSize(NARROW);
  await page.goto('/components/site-header/');
  await expect(page.locator(`${HEADER}__action`)).toBeHidden();
  const signature = await top(page, `${HEADER}__signature`);
  expect(await top(page, `${HEADER}__navigation`)).toBeGreaterThan(signature);
});

test('en-tête large : une seule rangée, action visible à la fin', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto('/components/site-header/');
  await expect(page.locator(`${HEADER}__action`)).toBeVisible();
  const tops = await Promise.all(
    ['signature', 'navigation', 'action'].map((zone) => top(page, `${HEADER}__${zone}`)),
  );
  const [first = 0] = tops;
  for (const value of tops) expect(Math.abs(value - first)).toBeLessThanOrEqual(8);
});

test('pied étroit : une colonne ; large : une colonne par slot', async ({ page }) => {
  await page.setViewportSize(NARROW);
  await page.goto('/components/site-footer/');
  const tops = () =>
    page
      .locator(`${FOOTER}__column`)
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
  const stacked = await tops();
  expect(new Set(stacked).size).toBe(stacked.length);
  await page.setViewportSize(WIDE);
  const columns = await tops();
  expect(columns).toHaveLength(3);
  expect(new Set(columns).size).toBe(1);
});
