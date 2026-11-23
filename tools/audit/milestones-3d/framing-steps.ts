// Cadrage à chaque étape (camera_fit.rs, ADR-0013) : l'active et ses deux suivantes entièrement
// dans le cadre avec une marge de 6 %, sur grand et petit écran, d'après `project()`.
import type { Launched } from './browser.ts';
import { openPage, untilEnhanced } from './browser.ts';
import { framingDetail, readMarks, worstMargin } from './marks.ts';
import { HOST, at, row } from './model.ts';
import type { Row } from './model.ts';
import { STEP_BUTTONS, untilCurrent } from './steps.ts';

const STAGE = `${HOST} .pp-milestones__stage`;
const SETTLE_MS = 1_200;

export async function auditFraming(engine: Launched, base: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (const viewport of ['desktop', 'mobile'] as const) {
    const where = at(engine.name, `cadrage à chaque étape, ${viewport}`);
    const { context, page } = await openPage(engine.browser, base, { viewport, marks: true });
    try {
      await untilEnhanced(page);
      const count = await page.locator(STEP_BUTTONS).count();
      const worst: number[] = [];
      for (let index = 0; index < count; index += 1) {
        await page.locator(STEP_BUTTONS).nth(index).click();
        await untilCurrent(page, index);
        await page.waitForTimeout(SETTLE_MS);
        const stage = await page.locator(STAGE).boundingBox();
        const margin = stage ? worstMargin(await readMarks(page), index, stage) : null;
        worst.push(margin ?? Number.NEGATIVE_INFINITY);
      }
      const { ok, detail } = framingDetail(Math.min(...worst));
      rows.push(
        row(where, 'active et deux suivantes dans le cadre', ok, `${count} étapes, ${detail}`),
      );
    } finally {
      await context.close();
    }
  }
  return rows;
}
