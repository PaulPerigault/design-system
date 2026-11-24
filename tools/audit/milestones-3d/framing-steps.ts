// Cadrage à chaque étape (camera_fit.rs, ADR-0013 et ADR-0014) : l'active (et, hors format compact,
// ses deux suivantes) entièrement dans le cadre avec une marge de 6 %, sur grand et petit écran,
// d'après `project()`. Au mobile, le plus grand badge HTML affiché fait au moins 150 px.
import type { Page } from '@playwright/test';
import type { Launched } from './browser.ts';
import { openPage, untilEnhanced } from './browser.ts';
import { framingDetail, readMarks, worstMargin } from './marks.ts';
import { HOST, at, row } from './model.ts';
import type { Row, Where } from './model.ts';
import { STEP_BUTTONS, untilCurrent } from './steps.ts';

const STAGE = `${HOST} .pp-milestones__stage`;
const SETTLE_MS = 1_200;
const SPRITE = `${HOST} .pp-milestones__sprite:not([data-hidden])`;
export const MOBILE_BADGE_MIN_PX = 150;
const SETTLE_TRIES = 8;
const STABLE_PX = 1;

/** Plus grande largeur d'un badge HTML affiché ; 0 si l'étape n'en montre aucun. */
const widest = (page: Page): Promise<number> =>
  page
    .locator(SPRITE)
    .evaluateAll((images) =>
      Math.max(0, ...images.map((image) => image.getBoundingClientRect().width)),
    );

function badgeRow(where: Where, badges: readonly number[]): Row {
  const smallest = Math.min(...badges);
  const detail = `plus petit badge actif ${smallest.toFixed(0)} px sur ${badges.length} étapes`;
  return row(where, 'badge HTML : 150 px au moins', smallest >= MOBILE_BADGE_MIN_PX, detail);
}

/** Attend que la taille du badge se stabilise (défilement animé et caméra qui rejoint l'étape). */
async function settledWidth(page: Page): Promise<number> {
  let previous = -1;
  for (let attempt = 0; attempt < SETTLE_TRIES; attempt += 1) {
    const width = await widest(page);
    if (Math.abs(width - previous) < STABLE_PX) return width;
    previous = width;
    await page.waitForTimeout(SETTLE_MS);
  }
  return previous;
}

/** Va à l'étape : marge la plus faible du cadrage et largeur du badge actif (0 sans badge). */
async function visit(page: Page, index: number): Promise<{ margin: number; width: number }> {
  await page.locator(STEP_BUTTONS).nth(index).click();
  await untilCurrent(page, index);
  await page.waitForTimeout(SETTLE_MS);
  const stage = await page.locator(STAGE).boundingBox();
  const margin = stage ? worstMargin(await readMarks(page), index, stage) : null;
  return { margin: margin ?? Number.NEGATIVE_INFINITY, width: await settledWidth(page) };
}

export async function auditFraming(engine: Launched, base: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (const viewport of ['desktop', 'mobile'] as const) {
    const where = at(engine.name, `cadrage à chaque étape, ${viewport}`);
    const { context, page } = await openPage(engine.browser, base, { viewport, marks: true });
    try {
      await untilEnhanced(page);
      const count = await page.locator(STEP_BUTTONS).count();
      const visits = [];
      for (let index = 0; index < count; index += 1) visits.push(await visit(page, index));
      const { ok, detail } = framingDetail(Math.min(...visits.map((v) => v.margin)));
      rows.push(row(where, 'active dans le cadre', ok, `${count} étapes, ${detail}`));
      const badges = visits.map((v) => v.width).filter((width) => width > 0);
      if (viewport === 'mobile') rows.push(badgeRow(where, badges));
    } finally {
      await context.close();
    }
  }
  return rows;
}
