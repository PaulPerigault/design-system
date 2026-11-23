// Clavier et clic sur les étapes (ADR-0013, décisions 3 et 4) : Tab atteint chaque étape, flèches,
// Début et Fin déplacent l'étape active, Entrée et clic font défiler vers le jalon, posent
// `aria-current="step"` et montrent son détail dans le panneau.
import type { Page } from '@playwright/test';
import { at, row } from './model.ts';
import type { Row, Where } from './model.ts';
import {
  STEP_BUTTONS,
  currentIndex,
  scrollY,
  shownDetail,
  stepNames,
  untilCurrent,
} from './steps.ts';

/**
 * WebKit sous macOS suit la convention de Safari : Tab ne s'arrête que sur les champs et les liens,
 * Option+Tab sur tous les contrôles (vérifié sur une page vide). Ailleurs, Tab suffit.
 */
const tabKey = (engine: string): string =>
  engine === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';

/** Parcourt la liste à la touche Tab (les liens sont franchis) et rend les libellés atteints. */
async function tabThrough(page: Page, count: number, tab: string): Promise<Set<string>> {
  const reached = new Set<string>();
  await page.locator(STEP_BUTTONS).first().focus();
  for (let i = 0; i < count; i += 1) {
    reached.add(await page.evaluate(() => document.activeElement?.textContent ?? ''));
    do await page.keyboard.press(tab);
    while (await page.evaluate(() => document.activeElement?.tagName === 'A'));
  }
  return reached;
}

/** Touche pressée, puis l'étape `expected` doit devenir active. */
async function press(page: Page, key: string, expected: number): Promise<string | null> {
  await page.keyboard.press(key);
  if (await untilCurrent(page, expected)) return null;
  return `${key} : étape ${await currentIndex(page)} au lieu de ${expected}`;
}

async function arrows(page: Page, where: Where, count: number): Promise<Row> {
  await page.locator(STEP_BUTTONS).first().focus();
  const last = count - 1;
  const moves: [string, number][] = [
    ['ArrowRight', 1],
    ['ArrowRight', 2],
    ['ArrowLeft', 1],
    ['End', last],
    ['Home', 0],
  ];
  for (const [key, expected] of moves) {
    const problem = await press(page, key, expected);
    if (problem) return row(where, 'flèches, Début et Fin', false, problem);
  }
  return row(where, 'flèches, Début et Fin', true, `${moves.length} touches, étape active suivie`);
}

/** Entrée ou clic sur l'étape `index` : défilement, `aria-current` et détail du jalon. */
async function choose(page: Page, index: number, how: 'Entrée' | 'clic'): Promise<Row> {
  const where = at('', 'clavier');
  const name = (await stepNames(page))[index] ?? '';
  const button = page.locator(STEP_BUTTONS).nth(index);
  const before = await scrollY(page);
  if (how === 'Entrée') {
    await button.focus();
    await page.keyboard.press('Enter');
  } else await button.click();
  const current = await untilCurrent(page, index);
  const moved = (await scrollY(page)) !== before;
  await page.waitForFunction(
    () => document.querySelector('[data-pp-detail]:not([hidden])') !== null,
  );
  const detail = await shownDetail(page);
  const ok = current && moved && detail.includes(name);
  const text = `aria-current=${current}, défilement ${moved}, panneau « ${detail.slice(0, 30)} »`;
  return row(where, `${how} choisit le jalon`, ok, text);
}

export async function auditKeyboard(page: Page, engine: string): Promise<Row[]> {
  const where = at(engine, 'clavier');
  const count = await page.locator(STEP_BUTTONS).count();
  const reached = await tabThrough(page, count, tabKey(engine));
  await page.locator(STEP_BUTTONS).nth(1).focus();
  const outline = await page
    .locator(STEP_BUTTONS)
    .nth(1)
    .evaluate((el) => {
      const style = getComputedStyle(el);
      return `${style.outlineStyle} ${style.outlineWidth}`;
    });
  const rows = [
    row(
      where,
      'tous les jalons atteignables',
      reached.size === count,
      `${reached.size} sur ${count} boutons par Tab`,
    ),
    row(
      where,
      'focus visible',
      !outline.startsWith('none') && !outline.endsWith(' 0px'),
      `contour ${outline}`,
    ),
    await arrows(page, where, count),
  ];
  rows.push(await choose(page, 2, 'Entrée'), await choose(page, 4, 'clic'));
  return rows.map((r) => ({ ...r, engine, scenario: 'clavier' }));
}
