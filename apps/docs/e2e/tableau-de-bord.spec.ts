import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { THEMES, setTheme } from './helpers';
import { FIGURES, PATH, WCAG_TAGS } from './tableau-de-bord';

const WINDOWS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'bureau', width: 1280, height: 800 },
] as const;
const REFLOW_WIDTH = 320;

for (const theme of THEMES) {
  for (const size of WINDOWS) {
    test.describe(`Tableau de bord (${theme}, ${size.name})`, () => {
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

test('reflow à 320 px : le contenu ne déborde pas', async ({ page }) => {
  await page.setViewportSize({ width: REFLOW_WIDTH, height: 640 });
  await page.goto(PATH);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('la page annonce des données d’exemple et présente chaque composant', async ({ page }) => {
  await page.goto(PATH);
  await expect(page.getByRole('note')).toContainText('Données d’exemple');
  for (const id of FIGURES) await expect(page.locator(`[id^="${id}"]`).first()).toBeAttached();
  await expect(page.locator('main h2')).toHaveCount(4);
});

test('clavier : les cases du tableau reçoivent le focus et masquent une colonne', async ({
  page,
}) => {
  await page.goto(PATH);
  const first = page.locator('#tdb-tableau-f1');
  const column = page.locator('main table').last().locator('thead th').nth(1);
  await expect(column).toBeVisible();
  await first.focus();
  await expect(first).toBeFocused();
  await page.keyboard.press('Space');
  await expect(first).not.toBeChecked();
  await expect(column).toBeHidden();
  await page.keyboard.press('Space');
  await expect(first).toBeChecked();
  await expect(column).toBeVisible();
});
