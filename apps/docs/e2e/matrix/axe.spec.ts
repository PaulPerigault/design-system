import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAGES, THEMES, visit } from '../helpers';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

// Toutes les pages construites × 2 thèmes, sur chaque appareil de la matrice (projet).
for (const path of PAGES) {
  for (const theme of THEMES) {
    test(`axe : ${path}, thème ${theme}`, async ({ page }) => {
      await visit(page, path, theme);
      const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(violations.map((v) => `${v.id} (${v.nodes.length}) : ${v.help}`)).toEqual([]);
    });
  }
}
