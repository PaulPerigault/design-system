// Robustesse : perte de contexte (repli, puis restauration), navigateur sans WebGL2, mouvement
// réduit, économie de données, appareil faible.
import type { Page } from '@playwright/test';
import type { Launched, Scenario } from './browser.ts';
import { openPage, untilEnhanced } from './browser.ts';
import { FALLBACK_MARGIN_MS, HOST, RESTORE_TIMEOUT_MS, at, row } from './model.ts';
import type { Row } from './model.ts';

const LIST = `${HOST} .pp-milestones__list`;
const BLOCKED_WAIT_MS = 2_000;
const RESTORE_DELAY_MS = 300;

/** Retour à la liste : plus de canvas ni d'état, liste présente et visible. */
async function classicOnly(page: Page): Promise<string | null> {
  const canvases = await page.locator(`${HOST} canvas`).count();
  const state = await page.locator(HOST).getAttribute('data-state');
  if (canvases > 0) return `${canvases} canvas encore présent(s)`;
  if (state !== null) return `état « ${state} » encore posé`;
  return (await page.locator(LIST).isVisible()) ? null : 'liste masquée';
}

async function stillEnhanced(page: Page): Promise<string | null> {
  const state = await page.locator(HOST).getAttribute('data-state');
  const canvases = await page.locator(`${HOST} canvas`).count();
  return state === 'enhanced' && canvases === 1 ? null : `état ${state}, ${canvases} canvas`;
}

async function lose(page: Page, restore: boolean): Promise<void> {
  await page.evaluate(
    ([again, delay]) => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-milestones-demo] canvas');
      const ext = canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context');
      ext?.loseContext();
      if (again) setTimeout(() => ext?.restoreContext(), Number(delay));
    },
    [restore, RESTORE_DELAY_MS],
  );
}

async function blocked(
  engine: Launched,
  base: string,
  name: string,
  scenario: Scenario,
): Promise<Row> {
  const { context, page } = await openPage(engine.browser, base, scenario);
  try {
    await page.locator(HOST).last().scrollIntoViewIfNeeded();
    await page.waitForTimeout(BLOCKED_WAIT_MS);
    const problem = await classicOnly(page);
    return row(
      at(engine.name, name),
      'aucune 3D, liste complète',
      problem === null,
      problem ?? 'liste seule',
    );
  } finally {
    await context.close();
  }
}

async function contextLoss(engine: Launched, base: string, restore: boolean): Promise<Row> {
  const where = at(engine.name, restore ? 'perte puis restauration' : 'perte sans restauration');
  const { context, page } = await openPage(engine.browser, base);
  try {
    await untilEnhanced(page);
    await lose(page, restore);
    await page.waitForTimeout(RESTORE_TIMEOUT_MS + FALLBACK_MARGIN_MS);
    const problem = restore ? await stillEnhanced(page) : await classicOnly(page);
    const ok = restore
      ? 'scène reprise, image recréée'
      : `repli en moins de ${RESTORE_TIMEOUT_MS + FALLBACK_MARGIN_MS} ms`;
    return row(
      where,
      restore ? 'scène reprise' : 'repli sur la liste',
      problem === null,
      problem ?? ok,
    );
  } finally {
    await context.close();
  }
}

const BLOCKERS: [string, Scenario][] = [
  ['prefers-reduced-motion', { reducedMotion: 'reduce' }],
  ['saveData', { saveData: true }],
  ['appareil faible (2 cœurs)', { weakDevice: true }],
  ['sans WebGL2', { noWebgl2: true }],
];

export async function auditRobust(engine: Launched, base: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (const [name, scenario] of BLOCKERS) rows.push(await blocked(engine, base, name, scenario));
  rows.push(await contextLoss(engine, base, false), await contextLoss(engine, base, true));
  return rows;
}
