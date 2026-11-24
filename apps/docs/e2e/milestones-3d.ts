import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PATH = '/components/milestones-3d/';
const ASSETS = fileURLToPath(new URL('../dist/_astro/', import.meta.url));
/** Le .wasm est dans le build seulement si la construction l'avait (jamais commité). */
export const hasWasm = (): boolean =>
  existsSync(ASSETS) &&
  readdirSync(ASSETS).some((file) => file.startsWith('pp_milestones') && file.endsWith('.wasm'));

/**
 * Avertissement du rastériseur logiciel de Chromium headless : un canvas WebGL2 qui ne fait que
 * `clear` l'émet aussi (vérifié hors de la page). Il ne vient pas de la scène.
 */
export const SOFTWARE_GL_NOISE = /GL Driver Message .*GPU stall due to ReadPixels/;

export const enhanced = (page: Page): Locator =>
  page.locator('[data-milestones-demo] .pp-milestones[data-state="enhanced"]');

/** Badge de démonstration : 4 jalons obtenus en portent un, le plus ancien est « Réseaux ». */
export const DEMO_STEPS = 9;

const SETTLE_MS = 800;

export async function activate(page: Page): Promise<void> {
  await page.goto(PATH);
  await page.locator('[data-milestones-demo]').scrollIntoViewIfNeeded();
  // Section déjà à l'écran : la 3D attend un geste discret (renouvelé, l'observateur répond en asynchrone).
  await expect(async () => {
    await page.keyboard.press('Shift');
    await expect(enhanced(page)).toHaveCount(1, { timeout: 1000 });
  }).toPass({ timeout: 30_000 });
  // L'empreinte étant réservée dès le HTML, la page peut être au milieu de la piste : on revient au début.
  await page.locator('[data-milestones-demo] [data-pp-track]').evaluate((track) => {
    track.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(SETTLE_MS);
}
