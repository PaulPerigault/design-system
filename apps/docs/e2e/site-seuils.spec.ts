import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { unfolded, widen } from './site-seuils';

const NARROW = { width: 360, height: 640 };
const WIDE = { width: 1440, height: 900 };
const MENUS = '.docs-main .demo-seuils .pp-site-menu';

test('barItems : quatre entrées en barre, huit dans le menu replié', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto('/components/site-menu/');
  const menu = page.locator(MENUS).first();
  await expect(menu.locator('.pp-site-menu__bar a')).toHaveCount(4);
  await expect(menu.locator('details a')).toHaveCount(8);
});

for (const [index, seuil] of [
  [1, 64],
  [2, 75],
] as const) {
  test(`expandAt ${seuil} : replié juste dessous, en ligne au seuil`, async ({ page }) => {
    await page.setViewportSize(WIDE);
    await page.goto('/components/site-menu/');
    const menu = page.locator(MENUS).nth(index);
    await widen(menu, seuil - 0.1);
    expect(await unfolded(menu)).toBe(false);
    await expect(menu.locator('summary')).toBeVisible();
    await widen(menu, seuil);
    expect(await unfolded(menu)).toBe(true);
    await expect(menu.locator('summary')).toBeHidden();
  });
}

for (const [name, viewport] of [
  ['360 px', NARROW],
  ['1440 px', WIDE],
] as const) {
  test(`axe : variantes SiteMenu et SiteHeader (${name})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const path of ['/components/site-menu/', '/components/site-header/']) {
      await page.goto(path);
      const { violations } = await new AxeBuilder({ page })
        .include('.demo-seuils, .demo-en-tetes')
        .analyze();
      expect(violations.map((v) => v.id)).toEqual([]);
    }
  });
}
