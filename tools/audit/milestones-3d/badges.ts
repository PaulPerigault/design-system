// Badges et interactions de la scène (ADR-0013, décisions 1 et 5) : texture chargée et visible, badge
// intact (aucun filtre ni opacité sur l'image), survol d'une médaille, jalon sans badge (coche en
// relief). L'image en échec est dans broken.ts.
import type { Page } from '@playwright/test';
import type { Launched } from './browser.ts';
import { openPage, untilEnhanced } from './browser.ts';
import { HOST, at, brief, row } from './model.ts';
import type { Row, Where } from './model.ts';
import { auditIntact } from './intact.ts';
import { auditHover } from './hover.ts';
import { centerShare } from './medal.ts';

export const BADGE_URL = /\/milestones-3d\/[^/]+\.webp$/;
export const TEXTURE_WAIT_MS = 3_000;
const BADGE_SHARE = 0.15;
const RELIEF_SHARE = 0.01;
const BADGE_TOLERANCE = 24;
const RELIEF_TOLERANCE = 4;
const NO_BADGE_ID = 'integration-continue';

interface Network {
  fetched: number[];
  failed: string[];
}

async function textureRows(page: Page, where: Where, net: Network): Promise<Row[]> {
  await page.waitForTimeout(TEXTURE_WAIT_MS);
  const share = await centerShare(page, 0, BADGE_TOLERANCE);
  const statuses = [...new Set(net.fetched)].join(', ') || 'aucun';
  return [
    row(
      where,
      'texture chargée : fetch du .webp',
      net.fetched.length > 0 && net.fetched.every((status) => status === 200),
      `${net.fetched.length} requête(s) fetch, statuts ${statuses}`,
    ),
    row(
      where,
      'texture chargée : aucune erreur de texture',
      net.failed.length === 0,
      net.failed.join(' | ') || 'aucune image en échec',
    ),
    row(
      where,
      'texture chargée : badge visible sur la médaille active',
      share >= BADGE_SHARE,
      `${(share * 100).toFixed(0)} % du centre diffère du support nu`,
    ),
  ];
}
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
      if (BADGE_URL.test(r.url()) && r.request().resourceType() === 'fetch') {
        net.fetched.push(r.status());
      }
    });
    p.on('requestfailed', (r) => BADGE_URL.test(r.url()) && net.failed.push(r.url()));
  });
  try {
    await untilEnhanced(page);
    const rows = [...(await textureRows(page, where, net)), await auditIntact(page, where)];
    return [...rows, await auditHover(page, where), await withoutBadge(page, where)];
  } catch (error) {
    return [row(where, 'badges et interactions', false, brief(error))];
  } finally {
    await context.close();
  }
}
