import { expect, test } from '@playwright/test';
import { COMPONENT_PAGES, visit } from '../helpers';

const PATH = '/components/button/';

test('menu mobile : ouverture, contenu, Échap, focus rendu, clic hors boîte', async ({
  page,
}, testInfo) => {
  await visit(page, PATH);
  const button = page.getByRole('button', { name: 'Menu' });
  if (!(await button.isVisible())) {
    // Écran large : pas de bouton, le lien « Composants » de l'en-tête reste.
    await expect(
      page
        .getByRole('navigation', { name: 'Principale' })
        .getByRole('link', { name: 'Composants' }),
    ).toBeVisible();
    return;
  }
  const dialog = page.locator('#docs-menu');
  await (testInfo.project.use.hasTouch ? button.tap() : button.click());
  await expect(dialog).toHaveAttribute('open', '');
  expect(await dialog.evaluate((el) => el.matches(':modal'))).toBe(true);
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  const hrefs = await dialog
    .locator('a')
    .evaluateAll((links) => links.map((a) => a.getAttribute('href')));
  expect([...hrefs].sort()).toEqual(COMPONENT_PAGES);
  await expect(dialog.locator('a[aria-current="page"]')).toHaveAttribute('href', PATH);
  const box = await dialog.boundingBox();
  const viewport = page.viewportSize();
  expect(box && viewport && box.y >= 0 && box.y + box.height <= viewport.height).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toHaveAttribute('open');
  await expect(button).toBeFocused();
  await button.click();
  await page.mouse.click(2, 2);
  await expect(dialog).not.toHaveAttribute('open');
});
