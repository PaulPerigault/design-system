// Badges et interactions de la scène (ADR-0014) : badge HTML (sprites.ts), image de la liste intacte,
// survol d'une médaille, jalon sans badge (coche en relief). L'image en échec est dans broken.ts.
import type { Page } from '@playwright/test';
import type { Launched } from './browser.ts';
import { openPage, untilEnhanced } from './browser.ts';
import { HOST, at, brief, row } from './model.ts';
import type { Row, Where } from './model.ts';
import { auditIntact } from './intact.ts';
import { auditHover } from './hover.ts';
import { centerShare } from './medal.ts';
import { BADGE_WAIT_MS, spriteRows, type Network } from './sprites.ts';

export { BADGE_WAIT_MS };

export const BADGE_URL = /\/milestones-3d\/[^/]+\.webp$/;
const RELIEF_SHARE = 0.01;
const RELIEF_TOLERANCE = 4;
const NO_BADGE_ID = 'integration-continue';

async function withoutBadge(page: Page, where: Where): Promise<Row> {
  const ids = await page
    .locator(`${HOST} [data-pp-item]`)
    .evaluateAll((items) => items.map((item) => item.getAttribute('data-pp-item')));
  const index = ids.indexOf(NO_BADGE_ID);
  const share = index < 0 ? 0 : await centerShare(page, index, RELIEF_TOLERANCE);
  const detail = `${(share * 100).toFixed(1)} % du centre en relief sur le support`;
  return row(where, 'jalon sans badge : coche en relief', share >= RELIEF_SHARE, detail);
}

export async function auditBadges(engine: Launched, base: string): Promise<Row[]> {
  const where = at(engine.name, 'badges');
  const net: Network = { fetched: [], failed: [] };
  const scenario = { marks: true, freshVisit: true };
  const { context, page } = await openPage(engine.browser, base, scenario, (p) => {
    p.on('response', (r) => {
      if (BADGE_URL.test(r.url()) && r.request().resourceType() === 'image') {
        net.fetched.push(r.status());
      }
    });
    p.on('requestfailed', (r) => BADGE_URL.test(r.url()) && net.failed.push(r.url()));
  });
  try {
    await untilEnhanced(page);
    const rows = [...(await spriteRows(page, where, net)), await auditIntact(page, where)];
    return [...rows, await auditHover(page, where), await withoutBadge(page, where)];
  } catch (error) {
    return [row(where, 'badges et interactions', false, brief(error))];
  } finally {
    await context.close();
  }
}
