import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { THEMES, VIEWPORTS, open } from './helpers';

const PATH = '/components/gallery/';
const FIRST = 'galerie-1';
const MAX_TABS = 40;

async function tabTo(page: Page, selector: string): Promise<void> {
  for (let tabs = 0; tabs < MAX_TABS; tabs++) {
    await page.keyboard.press('Tab');
    if (await page.locator(selector).evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error(`${selector} jamais atteint au clavier`);
}

const columns = (page: Page) =>
  page
    .locator('main .pp-gallery__list')
    .last()
    .locator('li')
    .evaluateAll(
      (items) => new Set(items.map((item) => Math.round(item.getBoundingClientRect().left))).size,
    );

for (const javaScriptEnabled of [true, false]) {
  test.describe(`JavaScript ${javaScriptEnabled ? 'actif' : 'désactivé'}`, () => {
    test.use({ javaScriptEnabled });

    test('clavier : Entrée ouvre, Échap ferme, le focus revient sur la vignette', async ({
      page,
    }) => {
      await open(page, PATH, VIEWPORTS[0]);
      const opener = `button[commandfor="${FIRST}"][command="show-modal"]`;
      await tabTo(page, opener);
      await page.keyboard.press('Enter');
      const dialog = page.locator(`#${FIRST}`);
      await expect(dialog).toHaveAttribute('open', '');
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(dialog).not.toHaveAttribute('open');
      await expect(page.locator(opener)).toBeFocused();
    });

    test('le bouton de fermeture ferme le dialogue', async ({ page }) => {
      await open(page, PATH, VIEWPORTS[0]);
      await page.locator(`button[commandfor="${FIRST}"][command="show-modal"]`).click();
      const dialog = page.locator(`#${FIRST}`);
      await expect(dialog).toHaveAttribute('open', '');
      await dialog.getByRole('button', { name: 'Fermer' }).click();
      await expect(dialog).not.toHaveAttribute('open');
    });
  });
}

test('une colonne à 390 px, trois à 1280 px', async ({ page }) => {
  await open(page, PATH, VIEWPORTS[1]);
  expect(await columns(page)).toBe(1);
  await open(page, PATH, VIEWPORTS[0]);
  expect(await columns(page)).toBe(3);
});

for (const theme of THEMES) {
  test(`axe : dialogue ouvert, thème ${theme}, mobile`, async ({ page }) => {
    await open(page, PATH, VIEWPORTS[1], theme);
    await page.locator(`button[commandfor="${FIRST}"][command="show-modal"]`).click();
    await expect(page.locator(`#${FIRST}`)).toHaveAttribute('open', '');
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
      .analyze();
    expect(violations.map((v) => `${v.id} (${v.nodes.length}) : ${v.help}`)).toEqual([]);
  });
}
