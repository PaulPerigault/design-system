import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { THEMES, setTheme } from './helpers';

const PATH = '/donnees/';
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const WINDOWS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablette', width: 800, height: 1000 },
] as const;
/** Une démonstration par composant de visualisation, dans l'ordre de la page. */
const DEMOS = ['line', 'bar', 'area', 'gauge', 'kpi', 'spark', 'table', 'legend'];

for (const theme of THEMES) {
  for (const size of WINDOWS) {
    test.describe(`Données (${theme}, ${size.name})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: size.width, height: size.height });
        await page.goto(PATH);
        await setTheme(page, theme);
      });

      test('axe : aucune violation WCAG 2.2 AA', async ({ page }) => {
        const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
        expect(
          violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`),
        ).toEqual([]);
      });

      test('aucun défilement horizontal de la page', async ({ page }) => {
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    });
  }
}

test('la page présente les huit composants, chacun avec son code et sa fiche', async ({ page }) => {
  await page.goto(PATH);
  for (const demo of DEMOS) {
    await expect(page.locator(`[id^="donnees-${demo}"]`).first()).toBeAttached();
  }
  await expect(page.locator('h3[id^="donnees-"]')).toHaveCount(DEMOS.length);
  await expect(page.getByRole('link', { name: /^Fiche / })).toHaveCount(DEMOS.length);
  await expect(page.locator('main pre')).toHaveCount(DEMOS.length + 2);
});

test('la page ne charge aucun script', async ({ page }) => {
  await page.goto(PATH);
  await expect(page.locator('main script')).toHaveCount(0);
});
