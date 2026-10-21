import { expect, test, type Page } from '@playwright/test';
import { VIEWPORTS, open } from './helpers';

const PATH = '/components/dialog/';
const TRIGGER = 'button[commandfor="demo-dialog"][command="show-modal"]';

/** Masque les API natives avant le chargement : le repli InvokerFallback doit s'installer. */
const hideNativeApis = () => {
  delete (HTMLButtonElement.prototype as { command?: unknown }).command;
  delete (HTMLDialogElement.prototype as { closedBy?: unknown }).closedBy;
};

async function errorsOf(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

for (const fallback of [false, true]) {
  test.describe(fallback ? 'API natives masquées (repli)' : 'API natives', () => {
    test.beforeEach(async ({ page }) => {
      if (fallback) await page.addInitScript(hideNativeApis);
    });

    test('Entrée ouvre, Échap ferme, le focus revient au déclencheur', async ({ page }) => {
      const errors = await errorsOf(page);
      await open(page, PATH, VIEWPORTS[0]);
      await page.locator(TRIGGER).focus();
      await page.keyboard.press('Enter');
      const dialog = page.locator('#demo-dialog');
      await expect(dialog).toHaveAttribute('open', '');
      expect(await dialog.evaluate((el) => el.matches(':modal'))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(dialog).not.toHaveAttribute('open');
      await expect(page.locator(TRIGGER)).toBeFocused();
      expect(errors).toEqual([]);
    });

    test('bouton de fermeture et clic hors de la boîte ferment', async ({ page }) => {
      await open(page, PATH, VIEWPORTS[1]);
      const dialog = page.locator('#demo-dialog');
      await page.locator(TRIGGER).click();
      await dialog.getByRole('button', { name: 'Annuler' }).click();
      await expect(dialog).not.toHaveAttribute('open');
      await page.locator(TRIGGER).click();
      await expect(dialog).toHaveAttribute('open', '');
      await page.mouse.click(2, 2);
      await expect(dialog).not.toHaveAttribute('open');
    });
  });
}

test('le repli ne charge rien de plus que son script, et seulement sur ses pages', async ({
  page,
}) => {
  const scripts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(new URL(request.url()).pathname);
  });
  await open(page, '/components/stack/', VIEWPORTS[0]);
  expect(scripts).toEqual([]);
  await open(page, PATH, VIEWPORTS[0]);
  expect(scripts).toHaveLength(1);
  expect(scripts[0]).toMatch(/^\/_astro\/.+\.js$/);
});
