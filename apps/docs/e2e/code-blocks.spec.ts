import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const NARROW = { width: 320, height: 640 };
const TRANSPARENT = 'rgba(0, 0, 0, 0)';

/** Premier bloc nu qui déborde de sa boîte (donc défile). */
const scrollable = (page: Page) =>
  page
    .locator('.docs-main pre:not([class])')
    .evaluateAll((blocks) => blocks.findIndex((el) => el.scrollWidth > el.clientWidth + 1));

const edgeColor = (page: Page, index: number) =>
  page
    .locator('.docs-main pre:not([class])')
    .nth(index)
    .evaluate((el) => getComputedStyle(el).borderInlineEndColor);

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(NARROW);
  await page.goto('/utiliser/');
});

test('un bloc de code large défile dans sa boîte, la page ne déborde pas', async ({ page }) => {
  expect(await scrollable(page)).toBeGreaterThanOrEqual(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
  const mode = await page
    .locator('.docs-main pre:not([class])')
    .first()
    .evaluate((el) => {
      return getComputedStyle(el).overflowX;
    });
  expect(mode).toBe('auto');
});

test('indice : filet d’accent tant qu’il reste du code, absent en bout de course', async ({
  page,
}) => {
  const index = await scrollable(page);
  expect(await edgeColor(page, index)).not.toBe(TRANSPARENT);
  await page
    .locator('.docs-main pre:not([class])')
    .nth(index)
    .evaluate((el) => el.scrollTo({ left: el.scrollWidth }));
  await expect.poll(() => edgeColor(page, index)).toBe(TRANSPARENT);
});

test('le bloc défilant prend le focus clavier, avec un contour visible', async ({ page }) => {
  const index = await scrollable(page);
  const block = page.locator('.docs-main pre:not([class])').nth(index);
  await block.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  expect(await block.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
  expect(await block.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
});

test('axe : aucun bloc défilant sans accès clavier', async ({ page }) => {
  const { violations } = await new AxeBuilder({ page })
    .withRules(['scrollable-region-focusable', 'color-contrast'])
    .analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});
