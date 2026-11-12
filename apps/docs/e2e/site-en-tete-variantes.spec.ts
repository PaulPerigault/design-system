import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { unfolded, widen } from './site-seuils';

const NARROW = { width: 360, height: 640 };
const WIDE = { width: 1440, height: 900 };
const HEADERS = '.docs-main .demo-en-tetes > .pp-site-header';

/** Boîte d'un élément visible : échoue au lieu de renvoyer `null`. */
async function rect(locator: Locator) {
  const box = await locator.first().boundingBox();
  if (box === null) throw new Error('élément sans boîte');
  return box;
}

for (const [index, seuil] of [
  [0, 75],
  [1, 64],
] as const) {
  test(`en-tête expandAt ${seuil} : action et menu changent d'état ensemble`, async ({ page }) => {
    await page.setViewportSize(WIDE);
    await page.goto('/components/site-header/');
    const header = page.locator(HEADERS).nth(index);
    await widen(header, seuil - 0.1);
    await expect(header.locator('.pp-site-header__action')).toBeHidden();
    expect(await unfolded(header)).toBe(false);
    await widen(header, seuil);
    await expect(header.locator('.pp-site-header__action')).toBeVisible();
    expect(await unfolded(header)).toBe(true);
  });
}

test('layout inline : signature et bouton de menu sur une rangée, bouton à droite', async ({
  page,
}) => {
  await page.setViewportSize(NARROW);
  await page.goto('/components/site-header/');
  const header = page.locator(HEADERS).first();
  const signature = await rect(header.locator('.pp-site-header__signature'));
  const summary = await rect(header.locator('summary'));
  const bar = await rect(header.locator('.pp-site-header__bar'));
  expect(Math.abs(summary.y - signature.y)).toBeLessThanOrEqual(8);
  expect(summary.x + summary.width).toBeGreaterThan((bar.x + bar.width) * 0.9);
  expect(bar.height).toBeLessThanOrEqual(64);
});

test('layout inline : le panneau ouvert se pose sous la rangée, axe sans violation', async ({
  page,
}) => {
  await page.setViewportSize(NARROW);
  await page.goto('/components/site-header/');
  const header = page.locator(HEADERS).first();
  await header.locator('summary').click();
  const panel = header.locator('.pp-site-menu__panel');
  await expect(panel.locator('a').first()).toBeVisible();
  const bar = await rect(header.locator('.pp-site-header__bar'));
  const opened = await rect(panel);
  expect(opened.y + 1).toBeGreaterThanOrEqual(bar.y + bar.height / 2);
  const { violations } = await new AxeBuilder({ page }).include('.demo-en-tetes').analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});

test('jetons de marges : l’en-tête les applique, les défauts restent', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto('/components/site-header/');
  const padding = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => {
        const { paddingBlockStart, paddingInlineStart } = getComputedStyle(el);
        return [parseFloat(paddingBlockStart), parseFloat(paddingInlineStart)];
      });
  const [baseBlock = 0, baseInline = 0] = await padding(`${HEADERS} .pp-site-header__bar`);
  const [block = 0, inline = 0] = await padding('.demo-marges .pp-site-header__bar');
  expect([baseBlock, baseInline]).toEqual([4, 16]);
  expect(block).toBeGreaterThan(baseBlock);
  expect(inline).toBeGreaterThan(baseInline);
});
