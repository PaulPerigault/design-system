import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { PAGES, THEMES, VIEWPORTS, open } from './helpers';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

const audit = (page: Page) => new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

for (const path of PAGES) {
  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      test(`axe : ${path}, thème ${theme}, ${viewport.name}`, async ({ page }) => {
        await open(page, path, viewport, theme);
        const { violations } = await audit(page);
        const summary = violations.map((v) => `${v.id} (${v.nodes.length}) : ${v.help}`);
        expect(summary).toEqual([]);
      });
    }
  }
}

test('canari : axe signale une image sans alt', async ({ page }) => {
  await open(page, '/components/stack/', VIEWPORTS[0]);
  await page.evaluate(() => {
    const img = document.createElement('img');
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    document.querySelector('main')?.append(img);
  });
  const { violations } = await audit(page);
  expect(violations.map((v) => v.id)).toContain('image-alt');
});
