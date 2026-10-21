import { expect, test, type Page } from '@playwright/test';
import { VIEWPORTS, open } from './helpers';

const PATH = '/components/dialog/';
const TRIGGER = 'button[commandfor="demo-dialog"][command="show-modal"]';

/**
 * Avant le chargement : compte les appels JavaScript à `showModal` et `close` (le comportement
 * natif ne passe pas par eux) et, en mode repli, masque les API pour que InvokerFallback
 * s'installe. Chromium garde son comportement natif : seul le compteur prouve qui a agi.
 */
function instrument(hide: boolean): void {
  const calls = { showModal: 0, close: 0 };
  Object.assign(window, { __ppDialogCalls: calls });
  const proto = HTMLDialogElement.prototype;
  for (const name of ['showModal', 'close'] as const) {
    const native = proto[name];
    proto[name] = function (this: HTMLDialogElement) {
      calls[name] += 1;
      native.call(this);
    };
  }
  if (hide) {
    delete (HTMLButtonElement.prototype as { command?: unknown }).command;
    delete (HTMLDialogElement.prototype as { closedBy?: unknown }).closedBy;
  }
}

const callsOf = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __ppDialogCalls: { showModal: number; close: number } })
        .__ppDialogCalls,
  );

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
      await page.addInitScript(instrument, fallback);
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
      // Repli : le script a ouvert ; natif : il est resté inactif.
      expect((await callsOf(page)).showModal).toBe(fallback ? 1 : 0);
    });

    test('au clic souris, le focus revient au déclencheur', async ({ page }) => {
      await open(page, PATH, VIEWPORTS[0]);
      await page.locator(TRIGGER).click();
      await expect(page.locator('#demo-dialog')).toHaveAttribute('open', '');
      await page.keyboard.press('Escape');
      await expect(page.locator(TRIGGER)).toBeFocused();
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
      // Pas de compteur ici : Chromium ferme au relâché, avant le clic que le repli écoute ;
      // la logique du clic hors boîte est prouvée par invokers.test.ts.
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
