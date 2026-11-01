import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { THEMES, setTheme } from './helpers';

const PATH = '/sobriete/';
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const WIDTHS = [320, 375, 1280];

for (const theme of THEMES) {
  test(`Sobriété (${theme}) : axe sans violation WCAG 2.2 AA`, async ({ page }) => {
    await page.goto(PATH);
    await setTheme(page, theme);
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual(
      [],
    );
  });
}

for (const width of WIDTHS) {
  test(`Sobriété : aucun défilement horizontal de la page à ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(PATH);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('Sobriété : les tableaux de poids et la méthode carbone sont présents, sans script', async ({
  page,
}) => {
  await page.goto(PATH);
  await expect(page.getByRole('table')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Estimation du carbone' })).toBeVisible();
  await expect(page.locator('main script')).toHaveCount(0);
});
