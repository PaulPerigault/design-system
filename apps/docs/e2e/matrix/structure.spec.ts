import { expect, test } from '@playwright/test';
import { PAGES, visit } from '../helpers';

/** Largeur sous laquelle l'en-tête passe à une rangée (48 rem, `styles/header.css`). */
const NARROW_MAX = 768;
/** Hauteur maximale d'un en-tête de colonne : une ligne de texte, pas une lettre par ligne. */
const MAX_HEADER_CELL_HEIGHT = 56;
/** Hauteur maximale de l'en-tête à une rangée : la marque peut tenir sur deux lignes. */
const MAX_NARROW_HEADER = 96;

test('un seul h1 par page, et aucun titre dans le panneau du menu', async ({ page }) => {
  for (const path of PAGES) {
    await visit(page, path);
    expect(await page.locator('h1').count(), `${path} : h1`).toBe(1);
    expect(await page.locator('#docs-menu h3, #docs-menu h4').count(), `${path} : menu`).toBe(0);
  }
});

test('en-tête : une rangée sous 48 rem, panneau avec les entrées principales', async ({ page }) => {
  await visit(page, '/components/button/');
  const width = page.viewportSize()?.width ?? 0;
  if (width >= NARROW_MAX) return;
  const header = await page.locator('.docs-header').boundingBox();
  expect(header?.height ?? Infinity).toBeLessThanOrEqual(MAX_NARROW_HEADER);
  await expect(page.locator('.docs-nav')).toBeHidden();
  const hrefs = await page
    .locator('#docs-menu section[aria-labelledby="menu-site"] a')
    .evaluateAll((links) => links.map((a) => a.getAttribute('href')));
  for (const href of ['/utiliser/', '/donnees/', '/preuves/', '/auteur/', '/recherche/']) {
    expect(hrefs).toContain(href);
  }
});

test('tableau des propriétés : en-têtes lisibles, aucun défilement de la page', async ({
  page,
}) => {
  await visit(page, '/components/button/');
  const heights = await page
    .locator('.props thead th')
    .evaluateAll((cells) => cells.map((cell) => cell.getBoundingClientRect().height));
  expect(heights.length).toBeGreaterThan(0);
  for (const height of heights) expect(height).toBeLessThanOrEqual(MAX_HEADER_CELL_HEIGHT);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
