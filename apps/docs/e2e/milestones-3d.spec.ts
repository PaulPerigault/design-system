import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { PATH, enhanced, hasWasm } from './milestones-3d';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const WIDTHS = [360, 1440] as const;
const HEIGHT = 900;
const MILESTONE_COUNT = 6;
const audit = (page: Page) => new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

test.describe('rendu classique (mouvement réduit)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('liste complète, aucun canvas, liste jamais masquée', async ({ page }) => {
    await page.goto(PATH);
    const lists = page.locator('.pp-milestones__list');
    await expect(lists).toHaveCount(2);
    for (const list of await lists.all()) {
      await expect(list.locator('li')).toHaveCount(MILESTONE_COUNT);
      await expect(list).toBeVisible();
    }
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.locator('.pp-milestones[data-state]')).toHaveCount(0);
    await expect(page.locator('.pp-milestones__stage').first()).toBeHidden();
  });

  test('statut écrit en toutes lettres et dates en français', async ({ page }) => {
    await page.goto(PATH);
    const first = page.locator('.pp-milestones__item').first();
    await expect(first.locator('.pp-milestones__status')).toHaveText('Atteint');
    await expect(first.locator('time')).toHaveText('mars 2025');
    await expect(page.locator('.pp-milestones__item[data-status="planned"]').first()).toContainText(
      'Prévu',
    );
  });

  for (const width of WIDTHS) {
    test(`axe sans violation à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.goto(PATH);
      expect((await audit(page)).violations.map((violation) => violation.id)).toEqual([]);
    });
  }
});

test.describe('rendu amélioré (WebGL2 logiciel)', () => {
  test.skip(!hasWasm(), 'Construction sans le .wasm : la 3D ne peut pas s’activer.');

  test('la 3D s’active : canvas masqué aux lecteurs d’écran, liste conservée', async ({ page }) => {
    await page.goto(PATH);
    await page.locator('[data-milestones-demo]').scrollIntoViewIfNeeded();
    await expect(enhanced(page)).toHaveCount(1, { timeout: 15_000 });
    const canvas = enhanced(page).locator('canvas');
    await expect(canvas).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas).toHaveAttribute('tabindex', '-1');
    await expect(enhanced(page).locator('.pp-milestones__item')).toHaveCount(MILESTONE_COUNT);
    await expect(enhanced(page).locator('.pp-milestones__select')).toHaveCount(MILESTONE_COUNT);
  });

  test('un bouton choisit le jalon et met le panneau à jour', async ({ page }) => {
    await page.goto(PATH);
    await page.locator('[data-milestones-demo]').scrollIntoViewIfNeeded();
    await expect(enhanced(page)).toHaveCount(1, { timeout: 15_000 });
    const button = enhanced(page).getByRole('button', { name: 'API publique' });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(enhanced(page).locator('[data-pp-panel]')).toContainText('API publique');
  });

  for (const width of WIDTHS) {
    test(`axe sans violation à ${width} px, 3D active`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.goto(PATH);
      await page.locator('[data-milestones-demo]').scrollIntoViewIfNeeded();
      await expect(enhanced(page)).toHaveCount(1, { timeout: 15_000 });
      expect((await audit(page)).violations.map((violation) => violation.id)).toEqual([]);
    });
  }
});
