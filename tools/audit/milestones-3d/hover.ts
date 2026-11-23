// Survol d'une médaille (ADR-0013) : la capture de la scène change quand le pointeur est sur la
// médaille suivante.
import type { Page } from '@playwright/test';
import { readMarks } from './marks.ts';
import { row } from './model.ts';
import type { Row, Where } from './model.ts';
import { SETTLE_MS, STAGE, discOf, goTo, shoot } from './medal.ts';
import { changedShare } from './patch.ts';

const HOVER_SHARE = 0.003;
const HOVER_TOLERANCE = 8;

export async function auditHover(page: Page, where: Where): Promise<Row> {
  await goTo(page, 0);
  const next = (await readMarks(page))[1];
  const stage = await page.locator(STAGE).boundingBox();
  const name = 'survol : l’état visuel change';
  if (!next?.visible || !stage) return row(where, name, false, 'médaille suivante invisible');
  const disc = await discOf(page, next);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(SETTLE_MS);
  const before = await shoot(page);
  await page.mouse.move(stage.x + disc.x, stage.y + disc.y);
  await page.waitForTimeout(SETTLE_MS);
  const share = changedShare(before, await shoot(page), HOVER_TOLERANCE);
  return row(
    where,
    name,
    share >= HOVER_SHARE,
    `${(share * 100).toFixed(2)} % des pixels changent`,
  );
}
