import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { THEMES, VIEWPORTS, setTheme } from './helpers';

const read = (path: string): string =>
  readFileSync(new URL(`../../../packages/${path}`, import.meta.url), 'utf8');
// Rendu d'essai de LineChart (trois séries), tenu à jour par le test Vitest du composant.
const FIGURE = read('astro/test/fixtures/line-chart.html');
const STYLES = [
  read('tokens/generated/tokens.css'),
  read('astro/src/data/chart-base.css'),
  read('astro/src/data/chart-series.css'),
  read('astro/src/data/line-chart.css'),
  read('astro/src/data/line-chart-series.css'),
].join('\n');
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

for (const theme of THEMES) {
  for (const viewport of VIEWPORTS) {
    test(`LineChart : axe sans violation (${theme}, ${viewport.name})`, async ({ page }) => {
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

test('LineChart : le SVG est nommé et n’embarque aucun script', async ({ page }) => {
  await page.setContent(
    `<!doctype html><html lang="fr"><title>Essai</title><body>${FIGURE}</body></html>`,
  );
  const svg = page.locator('figure > svg[role="img"]');
  await expect(svg).toHaveAttribute('aria-labelledby', 'visites-t visites-d');
  await expect(page.locator('script')).toHaveCount(0);
  await expect(page.locator('details.pp-line-chart__data')).not.toHaveAttribute('open', '');
});
