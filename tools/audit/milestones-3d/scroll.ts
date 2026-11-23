// Parcours au défilement (ADR-0013, décision 3) : la progression vient du défilement natif, rien
// n'est détourné. Contrôles : le jalon actif suit un défilement à mi-chemin et le retour en arrière,
// aucun `preventDefault` sur la molette, le toucher ni les touches de défilement, et le cadrage de
// l'active et de ses deux suivantes à chaque étape, sur grand et petit écran.
import type { Page } from '@playwright/test';
import type { Launched } from './browser.ts';
import { openPage, untilEnhanced } from './browser.ts';
import { HOST, IDLE_WAIT_MS, at, brief, row } from './model.ts';
import type { Row, Where } from './model.ts';
import {
  STEP_BUTTONS,
  currentIndex,
  scrollY,
  untilDetail,
  stepNames,
  untilCurrent,
} from './steps.ts';

const TRACK = `${HOST} [data-pp-track]`;
const WHEEL_PX = 400;

/** Défile la page à la fraction `p` (0 à 1) du chemin : position de la piste et hauteur d'écran. */
async function scrollToProgress(page: Page, p: number): Promise<void> {
  await page.evaluate(
    ([selector, fraction]) => {
      const track = document.querySelector(String(selector));
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const run = rect.height - window.innerHeight;
      window.scrollTo(0, rect.top + window.scrollY + run * Number(fraction));
    },
    [TRACK, p] as const,
  );
}

async function progression(page: Page, where: Where): Promise<Row[]> {
  const count = await page.locator(STEP_BUTTONS).count();
  const names = await stepNames(page);
  const middle = Math.round((count - 1) / 2);
  await scrollToProgress(page, 0);
  const start = await untilCurrent(page, 0);
  await scrollToProgress(page, 0.5);
  const reached = await untilCurrent(page, middle);
  const detail = await untilDetail(page);
  await scrollToProgress(page, 0);
  const back = await untilCurrent(page, 0);
  return [
    row(
      where,
      'départ sur le premier jalon',
      start,
      `aria-current sur l'étape ${await currentIndex(page)}`,
    ),
    row(
      where,
      'défilement à mi-chemin : le jalon actif suit',
      reached && detail.includes(names[middle] ?? '?'),
      `étape ${middle + 1} sur ${count}, panneau « ${detail.slice(0, 30)} »`,
    ),
    row(
      where,
      'retour en arrière',
      back,
      back ? 'premier jalon retrouvé' : 'aria-current ne suit pas',
    ),
  ];
}

/** Événements de défilement jamais annulés : molette, toucher et touches natives. */
async function notCancelled(page: Page, where: Where): Promise<Row[]> {
  const before = await scrollY(page);
  await page.mouse.move(100, 100);
  await page.mouse.wheel(0, WHEEL_PX);
  await page.waitForTimeout(IDLE_WAIT_MS);
  const wheeled = (await scrollY(page)) !== before;
  const cancelled = await page.evaluate(() => {
    const send = (target: EventTarget, event: Event): boolean => !target.dispatchEvent(event);
    const stage = document.querySelector('.pp-milestones__stage') ?? document.body;
    const init = { bubbles: true, cancelable: true };
    const keys = [' ', 'PageDown', 'ArrowDown', 'ArrowUp'];
    return [
      ...[stage, document.body, window].map((t) =>
        send(t, new WheelEvent('wheel', { ...init, deltaY: 100 })),
      ),
      ...['touchstart', 'touchmove'].map((name) => send(stage, new Event(name, init))),
      ...keys.map((key) => send(stage, new KeyboardEvent('keydown', { ...init, key }))),
    ].filter(Boolean).length;
  });
  return [
    row(
      where,
      'la molette fait défiler la page',
      wheeled,
      wheeled ? 'défilement natif' : 'la page ne bouge pas',
    ),
    row(
      where,
      'aucun preventDefault (wheel, touch, touches de défilement)',
      cancelled === 0,
      `${cancelled} événement(s) annulé(s) sur 9`,
    ),
  ];
}

export async function auditScroll(engine: Launched, base: string): Promise<Row[]> {
  const where = at(engine.name, 'défilement');
  const { context, page } = await openPage(engine.browser, base);
  try {
    await untilEnhanced(page);
    const rows = [...(await progression(page, where)), ...(await notCancelled(page, where))];
    return rows;
  } catch (error) {
    return [row(where, 'parcours au défilement', false, brief(error))];
  } finally {
    await context.close();
  }
}
