import { expect, test } from '@playwright/test';
import { COMPONENT_PAGES, VIEWPORTS, open } from './helpers';

test('le sommaire liste exactement les pages de composants construites', async ({ page }) => {
  await open(page, '/composants/', VIEWPORTS[0]);
  const hrefs = await page
    .locator('#composants ~ .docs-summary a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect([...hrefs].sort()).toEqual(COMPONENT_PAGES);
});

test('chaque page de composant mène au sommaire', async ({ page }) => {
  await open(page, COMPONENT_PAGES[0] ?? '/', VIEWPORTS[1]);
  const header = page
    .getByRole('navigation', { name: 'Principale' })
    .getByRole('link', { name: 'Composants' });
  if (await header.isVisible()) await header.click();
  else {
    // Sous 48 rem, l'en-tête tient sur une rangée : le lien est dans le panneau du menu.
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.locator('#docs-menu').getByRole('link', { name: 'Composants', exact: true }).click();
  }
  await expect(page.locator('#composants')).toBeInViewport();
});
