import { expect, test } from '@playwright/test';
import { COMPONENT_PAGES, VIEWPORTS, open } from './helpers';

test('le sommaire liste exactement les pages de composants construites', async ({ page }) => {
  await open(page, '/', VIEWPORTS[0]);
  const hrefs = await page
    .locator('#composants ~ .docs-summary a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect([...hrefs].sort()).toEqual(COMPONENT_PAGES);
});

test('chaque page de composant mène au sommaire', async ({ page }) => {
  await open(page, COMPONENT_PAGES[0] ?? '/', VIEWPORTS[1]);
  await page
    .getByRole('navigation', { name: 'Principale' })
    .getByRole('link', { name: 'Composants' })
    .click();
  await expect(page.locator('#composants')).toBeInViewport();
});
