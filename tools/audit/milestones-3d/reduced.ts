// Mouvement réduit (ADR-0013, décision 3) : la 3D reste, sans piste haute ni `position: sticky`
// (la section a la hauteur de l'écran), navigation par étapes, la caméra saute sans animation.
// Remplace le repli total de l'ADR-0012 (« aucune 3D, liste complète »).
import type { Page } from '@playwright/test';
import type { Launched } from './browser.ts';
import { openPage, untilEnhanced } from './browser.ts';
import { HOST, at, row } from './model.ts';
import type { Row, Where } from './model.ts';
import { STEP_BUTTONS, scrollY } from './steps.ts';

const FRAME = `${HOST} .pp-milestones__frame`;
const TRACK = `${HOST} [data-pp-track]`;

async function layout(page: Page, where: Where): Promise<Row[]> {
  const mode = await page.locator(HOST).getAttribute('data-mode');
  const canvases = await page.locator(`${HOST} canvas`).count();
  const sticky = await page.locator(FRAME).evaluate((el) => getComputedStyle(el).position);
  const track = (await page.locator(TRACK).boundingBox())?.height ?? Number.NaN;
  const height = page.viewportSize()?.height ?? 0;
  const flat = sticky !== 'sticky' && track <= height + 1;
  return [
    row(
      where,
      'la scène reste',
      canvases === 1 && mode === 'steps',
      `${canvases} canvas, mode ${mode}`,
    ),
    row(
      where,
      'pas de piste haute ni de sticky',
      flat,
      `position ${sticky}, piste ${Math.round(track)} px pour ${height} px d'écran`,
    ),
  ];
}

/** Même tâche que le clic : `aria-current` posé avant toute image prouve le saut sans animation. */
async function jump(page: Page, where: Where): Promise<Row> {
  const before = await scrollY(page);
  const current = await page
    .locator(STEP_BUTTONS)
    .nth(3)
    .evaluate((button) => {
      (button as HTMLElement).click();
      return button.getAttribute('aria-current');
    });
  const still = (await scrollY(page)) === before;
  const detail = `aria-current=${current} aussitôt, défilement ${still ? 'inchangé' : 'modifié'}`;
  return row(
    where,
    'un clic sur une étape saute sans animation',
    current === 'step' && still,
    detail,
  );
}

export async function auditReduced(engine: Launched, base: string): Promise<Row[]> {
  const where = at(engine.name, 'prefers-reduced-motion');
  const { context, page } = await openPage(engine.browser, base, { reducedMotion: 'reduce' });
  try {
    await untilEnhanced(page);
    return [...(await layout(page, where)), await jump(page, where)];
  } finally {
    await context.close();
  }
}
