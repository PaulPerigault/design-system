import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const NARROW = { width: 360, height: 640 };
const WIDE = { width: 1440, height: 900 };
const MENU = '.docs-main .pp-site-menu';

const visible = (page: Page, selector: string) => page.locator(selector).first().isVisible();

test('étroit : seul le repli est visible, fermé, et il s’ouvre au clavier', async ({ page }) => {
  await page.setViewportSize(NARROW);
  await page.goto('/components/site-menu/');
  expect(await visible(page, `${MENU} summary`)).toBe(true);
  expect(await visible(page, `${MENU} .pp-site-menu__bar`)).toBe(false);
  const links = page.locator(`${MENU} details a[href]`);
  await expect(links.first()).toBeHidden();
  await page.locator(`${MENU} summary`).focus();
  await page.keyboard.press('Enter');
  await expect(links.first()).toBeVisible();
  await page.keyboard.press('Space');
  await expect(links.first()).toBeHidden();
});

test('étroit : la page courante est marquée et la cible fait 44 px', async ({ page }) => {
  await page.setViewportSize(NARROW);
  await page.goto('/components/site-menu/');
  await page.locator(`${MENU} summary`).click();
  await expect(page.locator(`${MENU} details a[aria-current="page"]`)).toHaveCount(1);
  const heights = await page
    .locator(`${MENU} summary, ${MENU} details a`)
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);
});

test('large : la liste est en ligne, le repli est masqué', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto('/components/site-menu/');
  expect(await visible(page, `${MENU} .pp-site-menu__bar`)).toBe(true);
  expect(await visible(page, `${MENU} summary`)).toBe(false);
});

for (const [name, viewport] of [
  ['étroit, ouvert', NARROW],
  ['large', WIDE],
] as const) {
  test(`axe : aucune violation (${name})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/components/site-menu/');
    if (viewport === NARROW) await page.locator(`${MENU} summary`).click();
    const { violations } = await new AxeBuilder({ page }).include(MENU).analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  });
}
