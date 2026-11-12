import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

const NARROW = { width: 360, height: 640 };
const WIDE = { width: 1440, height: 900 };
const FOOTERS = '.docs-main .demo-pieds > .pp-site-footer';

/** Boîte d'un élément visible : échoue au lieu de renvoyer `null`. */
async function rect(locator: Locator) {
  const box = await locator.first().boundingBox();
  if (box === null) throw new Error('élément sans boîte');
  return box;
}

for (const viewport of [NARROW, WIDE]) {
  test(`slot legal : pleine largeur sous les colonnes, même footer (${viewport.width} px)`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/components/site-footer/');
    const footer = page.locator(FOOTERS).first();
    await expect(footer.locator(':scope > .pp-site-footer__legal')).toHaveCount(1);
    const columns = await rect(footer.locator('.pp-site-footer__columns'));
    const legal = await rect(footer.locator('.pp-site-footer__legal'));
    const whole = await rect(footer);
    expect(legal.y).toBeGreaterThanOrEqual(columns.y + columns.height - 1);
    expect(legal.width).toBeGreaterThanOrEqual(whole.width - 1);
  });
}

test('colonnes inchangées avec le slot legal : trois à 1440 px, empilées à 360 px', async ({
  page,
}) => {
  await page.goto('/components/site-footer/');
  const tops = () =>
    page
      .locator(`${FOOTERS} >> nth=0`)
      .locator('.pp-site-footer__column')
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
  await page.setViewportSize(WIDE);
  expect(new Set(await tops()).size).toBe(1);
  await page.setViewportSize(NARROW);
  const stacked = await tops();
  expect(new Set(stacked).size).toBe(stacked.length);
});

test('slot legal vide : aucun élément (pied de la variante à marges)', async ({ page }) => {
  await page.goto('/components/site-footer/');
  await expect(page.locator('.demo-marges .pp-site-footer__legal')).toHaveCount(0);
});

test('jetons de marges : le pied les applique, les défauts restent', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto('/components/site-footer/');
  const padding = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => {
        const { paddingBlockStart, paddingInlineStart } = getComputedStyle(el);
        return [parseFloat(paddingBlockStart), parseFloat(paddingInlineStart)];
      });
  const [baseBlock = 0, baseInline = 0] = await padding(`${FOOTERS} .pp-site-footer__columns`);
  const [block = 0, inline = 0] = await padding('.demo-marges .pp-site-footer__columns');
  expect([baseBlock, baseInline]).toEqual([24, 16]);
  expect(block).toBeGreaterThan(baseBlock);
  expect(inline).toBeGreaterThan(baseInline);
});

test('habillage de SiteNav : couleur, graisse, soulignement et écart changent', async ({
  page,
}) => {
  await page.setViewportSize(WIDE);
  await page.goto('/components/site-nav/');
  const style = (scope: string) =>
    page
      .locator(`${scope} a[aria-current="page"]`)
      .first()
      .evaluate((el) => {
        const css = getComputedStyle(el);
        const list = getComputedStyle(el.closest('ul') as HTMLElement);
        return { color: css.color, weight: css.fontWeight, gap: list.columnGap };
      });
  const base = await style('#exemples + .pp-component-page__examples .pp-site-nav');
  const tuned = await style('.demo-habillage .pp-site-nav');
  expect(tuned.color).not.toBe(base.color);
  expect(Number(tuned.weight)).toBeLessThan(Number(base.weight));
  expect(parseFloat(tuned.gap)).toBe(12);
  expect(parseFloat(base.gap)).toBe(16);
});

for (const viewport of [NARROW, WIDE]) {
  test(`axe : variantes SiteFooter et SiteNav (${viewport.width} px)`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const path of ['/components/site-footer/', '/components/site-nav/']) {
      await page.goto(path);
      const { violations } = await new AxeBuilder({ page })
        .include('.demo-pieds, .demo-habillage')
        .analyze();
      expect(violations.map((v) => v.id)).toEqual([]);
    }
  });
}
