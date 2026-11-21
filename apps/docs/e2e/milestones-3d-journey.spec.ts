import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { DEMO_STEPS, activate, enhanced, hasWasm } from './milestones-3d';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const WIDTHS = [360, 1440] as const;
const HEIGHT = 900;
const FIRST = 'Réseaux et protocoles';
const audit = (page: Page) => new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

test.describe('parcours amélioré (WebGL2 logiciel)', () => {
  test.skip(!hasWasm(), 'Construction sans le .wasm : la 3D ne peut pas s’activer.');

  test('la 3D s’active : canvas masqué, piste haute, scène épinglée, liste conservée', async ({
    page,
  }) => {
    await activate(page);
    const host = enhanced(page);
    await expect(host).toHaveAttribute('data-mode', 'scroll');
    await expect(host.locator('canvas')).toHaveAttribute('aria-hidden', 'true');
    await expect(host.locator('canvas')).toHaveAttribute('tabindex', '-1');
    await expect(host.locator('.pp-milestones__item')).toHaveCount(DEMO_STEPS);
    await expect(host.locator('.pp-milestones__select')).toHaveCount(DEMO_STEPS);
    const track = await host.locator('[data-pp-track]').boundingBox();
    expect(track?.height).toBeGreaterThan(HEIGHT * DEMO_STEPS * 0.5);
    await expect(host.locator('.pp-milestones__frame')).toHaveCSS('position', 'sticky');
  });

  test('une étape défile vers son jalon et ouvre son détail ; retour en arrière', async ({
    page,
  }) => {
    await activate(page);
    const host = enhanced(page);
    const second = host.getByRole('button', { name: 'Fondamentaux du Cloud' });
    await second.click();
    await expect(second).toHaveAttribute('aria-current', 'step');
    await expect(host.locator('[data-pp-panel]')).toContainText('Fondamentaux du Cloud');
    await expect(host.locator('[data-pp-panel]')).toBeVisible();
    await host.getByRole('button', { name: FIRST }).click();
    await expect(host.getByRole('button', { name: FIRST })).toHaveAttribute('aria-current', 'step');
  });

  test('flèches, Précédent et Suivant déplacent l’étape ; Tab n’est pas piégé', async ({
    page,
  }) => {
    await activate(page);
    const host = enhanced(page);
    const steps = host.locator('.pp-milestones__select');
    await steps.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(steps.nth(1)).toHaveAttribute('aria-current', 'step');
    await host.getByRole('button', { name: 'Suivant' }).click();
    await expect(steps.nth(2)).toHaveAttribute('aria-current', 'step');
    await page.keyboard.press('End');
    await expect(steps.last()).toHaveAttribute('aria-current', 'step');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBeNull();
  });

  test('le panneau n’est pas une région annoncée', async ({ page }) => {
    await activate(page);
    await expect(enhanced(page).locator('[aria-live]')).toHaveCount(0);
    await expect(enhanced(page).locator('[data-pp-panel]')).toHaveAttribute('role', 'region');
  });

  for (const width of WIDTHS) {
    test(`axe sans violation à ${width} px, 3D active`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await activate(page);
      expect((await audit(page)).violations.map((violation) => violation.id)).toEqual([]);
    });
  }
});

test.describe('mouvement réduit (WebGL2 logiciel)', () => {
  test.skip(!hasWasm(), 'Construction sans le .wasm : la 3D ne peut pas s’activer.');
  test.use({ reducedMotion: 'reduce' });

  test('la 3D reste, sans piste haute ni sticky : navigation par étapes', async ({ page }) => {
    await activate(page);
    const host = enhanced(page);
    await expect(host).toHaveAttribute('data-mode', 'steps');
    await expect(host.locator('.pp-milestones__frame')).not.toHaveCSS('position', 'sticky');
    const track = await host.locator('[data-pp-track]').boundingBox();
    expect(track?.height).toBeLessThanOrEqual(HEIGHT + 1);
    await host.getByRole('button', { name: 'Suivant' }).click();
    await expect(host.locator('.pp-milestones__select').nth(1)).toHaveAttribute(
      'aria-current',
      'step',
    );
  });
});
