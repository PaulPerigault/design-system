import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { DEMO_STEPS, PATH } from './milestones-3d';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const WIDTHS = [360, 1440] as const;
const HEIGHT = 900;
const FIRST = 'Réseaux et protocoles';
const audit = (page: Page) => new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

test.describe('rendu classique (sans JavaScript)', () => {
  test.use({ javaScriptEnabled: false });

  test('liste complète triée par date, objectif compris, jamais masquée', async ({ page }) => {
    await page.goto(PATH);
    const list = page.locator('.pp-milestones__list');
    await expect(list).toBeVisible();
    await expect(list.locator('li')).toHaveCount(DEMO_STEPS);
    await expect(list.locator('li').first()).toContainText(FIRST);
    await expect(list.locator('li').last()).toContainText('Architecte certifié');
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.locator('.pp-milestones[data-state]')).toHaveCount(0);
    await expect(page.locator('.pp-milestones__stage')).toBeHidden();
  });

  test('statut en toutes lettres, date en français, badge net sans alt bruyant', async ({
    page,
  }) => {
    await page.goto(PATH);
    const first = page.locator('.pp-milestones__item').first();
    await expect(first.locator('.pp-milestones__status')).toHaveText('Obtenu');
    await expect(first.locator('time')).toHaveText('novembre 2022');
    await expect(first.locator('img')).toHaveAttribute('alt', '');
    await expect(first.getByRole('link', { name: /Vérifier sur Credly/ })).toBeVisible();
    await expect(page.locator('.pp-milestones__item[data-status="planned"]').first()).toContainText(
      'Prévu',
    );
  });

  test('les panneaux de détail sont rendus mais masqués', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator('[data-pp-detail]')).toHaveCount(DEMO_STEPS);
    await expect(page.locator('[data-pp-detail]').first()).toBeHidden();
  });
});

test.describe('rendu classique (WebGL2 absent)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
        return type === 'webgl2'
          ? null
          : (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof original;
    });
  });

  for (const width of WIDTHS) {
    test(`axe sans violation à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.goto(PATH);
      expect((await audit(page)).violations.map((violation) => violation.id)).toEqual([]);
    });
  }
});
