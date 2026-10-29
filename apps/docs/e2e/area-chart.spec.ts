import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { THEMES, VIEWPORTS, setTheme } from './helpers';

const read = (path: string): string =>
  readFileSync(new URL(`../../../packages/${path}`, import.meta.url), 'utf8');
// Rendus d'essai de AreaChart, tenus à jour par le test Vitest du composant.
const FIGURES = { 'empilées, avec trous': read('astro/test/fixtures/area-chart.html') };
const STYLES = [
  read('tokens/generated/tokens.css'),
  read('astro/src/data/chart-base.css'),
  read('astro/src/data/chart-series.css'),
  read('astro/src/data/line-chart.css'),
  read('astro/src/data/line-chart-series.css'),
  read('astro/src/data/area-chart.css'),
].join('\n');
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

for (const [name, figure] of Object.entries(FIGURES)) {
  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      test(`AreaChart ${name} : axe sans violation (${theme}, ${viewport.name})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.setContent(
          `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Essai</title>` +
            `<style>${STYLES} body{background:var(--pp-color-bg);color:var(--pp-color-fg)}</style>` +
            `</head><body><main>${figure}</main></body></html>`,
        );
        await setTheme(page, theme);
        const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
        expect(
          violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`),
        ).toEqual([]);
      });
    }
  }
}

test('AreaChart : le SVG est nommé, ses motifs et tracés résolvent, aucun script', async ({
  page,
}) => {
  const figure = Object.values(FIGURES)[0] ?? '';
  await page.setContent(
    `<!doctype html><html lang="fr"><title>Essai</title><body>${figure}</body></html>`,
  );
  await expect(page.locator('figure > svg[role="img"]')).toHaveAttribute(
    'aria-labelledby',
    'budget-t budget-d',
  );
  await expect(page.locator('script')).toHaveCount(0);
  await expect(page.locator('details.pp-area-chart__data')).not.toHaveAttribute('open', '');
  for (const rank of [1, 2, 3]) {
    await expect(page.locator(`#budget-p${rank}`)).toHaveCount(1);
    await expect(page.locator(`#budget-a${rank}`)).toHaveCount(1);
  }
});
