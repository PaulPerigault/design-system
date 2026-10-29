import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { THEMES, VIEWPORTS, setTheme } from './helpers';

const read = (path: string): string =>
  readFileSync(new URL(`../../../packages/${path}`, import.meta.url), 'utf8');
// Rendu d'essai de Legend, tenu à jour par le test Vitest du composant.
const FIGURE = read('astro/test/fixtures/legend.html');
const STYLES = [read('tokens/generated/tokens.css'), read('astro/src/data/legend.css')].join('\n');
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

for (const theme of THEMES) {
  for (const viewport of VIEWPORTS) {
    test(`Legend : axe sans violation (${theme}, ${viewport.name})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.setContent(
        `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Essai</title>` +
          `<style>${STYLES} body{background:var(--pp-color-bg);color:var(--pp-color-fg)}</style>` +
          `</head><body><main>${FIGURE}</main></body></html>`,
      );
      await setTheme(page, theme);
      const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual(
        [],
      );
    });
  }
}

test('Legend : liste nommée, un libellé par entrée, aucun script', async ({ page }) => {
  await page.setContent(
    `<!doctype html><html lang="fr"><title>Essai</title><body>${FIGURE}</body></html>`,
  );
  await expect(page.getByRole('list', { name: 'Légende' }).getByRole('listitem')).toHaveCount(3);
  await expect(page.locator('script')).toHaveCount(0);
});
