// Médailles de la scène vues dans une capture : disque d'une médaille d'après `project()`, passage à
// une étape, part du centre qui diffère du support nu.
import type { Page } from '@playwright/test';
import { readMarks } from './marks.ts';
import type { Mark } from './marks.ts';
import { HOST } from './model.ts';
import { centerDifference, supportColor } from './patch.ts';
import { decodePng } from './png.ts';
import { STEP_BUTTONS, untilCurrent } from './steps.ts';

export const STAGE = `${HOST} .pp-milestones__stage`;
export const SETTLE_MS = 1_200;

export const shoot = async (page: Page) => decodePng(await page.locator(STAGE).screenshot());

/** Disque de la médaille `mark` dans la capture de la scène (pixels). */
export async function discOf(page: Page, mark: Mark | undefined) {
  const stage = (await page.locator(STAGE).boundingBox()) ?? { width: 0, height: 0 };
  if (!mark) return { x: 0, y: 0, radius: 1 };
  return { x: mark.x * stage.width, y: mark.y * stage.height, radius: mark.scale * stage.height };
}

export async function goTo(page: Page, index: number): Promise<void> {
  await page.locator(STEP_BUTTONS).nth(index).click();
  await untilCurrent(page, index);
  await page.waitForTimeout(SETTLE_MS);
}

/** Part du centre de la médaille `index` qui diffère du support nu. */
export async function centerShare(page: Page, index: number, tolerance: number): Promise<number> {
  await goTo(page, index);
  const disc = await discOf(page, (await readMarks(page))[index]);
  const image = await shoot(page);
  return centerDifference(image, disc, supportColor(image, disc), tolerance);
}
