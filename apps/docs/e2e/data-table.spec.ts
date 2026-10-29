import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { THEMES, VIEWPORTS, setTheme } from './helpers';

const read = (path: string): string =>
  readFileSync(new URL(`../../../packages/${path}`, import.meta.url), 'utf8');
// Rendu d'essai de DataTable, tenu à jour par le test Vitest du composant.
const FIGURE = read('astro/test/fixtures/data-table.html');
const STYLES = [read('tokens/generated/tokens.css'), read('astro/src/data/data-table.css')].join(
  '\n',
);
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

const load = (page: Page) =>
  page.setContent(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Essai</title>` +
      `<style>${STYLES} body{background:var(--pp-color-bg);color:var(--pp-color-fg)}</style>` +
      `</head><body><main>${FIGURE}</main></body></html>`,
  );

for (const theme of THEMES) {
  for (const viewport of VIEWPORTS) {
    test(`DataTable : axe sans violation (${theme}, ${viewport.name})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await load(page);
      await setTheme(page, theme);
      const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual(
        [],
      );
    });
  }
}

test('DataTable : décocher une série masque sa colonne, la recocher la rend', async ({ page }) => {
  await load(page);
  const heads = page.locator('thead th');
  await expect(heads).toHaveCount(3);
  await expect(heads.nth(2)).toBeVisible();
  await page.getByLabel('Pages vues').uncheck();
  await expect(heads.nth(2)).toBeHidden();
  await expect(heads.nth(1)).toBeVisible();
  await page.getByLabel('Pages vues').check();
  await expect(heads.nth(2)).toBeVisible();
});

test('DataTable : les cases se basculent au clavier', async ({ page }) => {
  await load(page);
  await page.getByLabel('Visites').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('thead th').nth(1)).toBeHidden();
});
