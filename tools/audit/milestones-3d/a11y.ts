// Accessibilité : axe avec et sans 3D (360 et 1440 px), clavier complet, focus visible, contraste du
// panneau de détail.
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import type { Launched } from './browser.ts';
import { openPage, untilEnhanced } from './browser.ts';
import { resolveTokens } from './colors.ts';
import { HOST, at, row } from './model.ts';
import type { Row } from './model.ts';
import { contrast } from './pixels.ts';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const MIN_TEXT_CONTRAST = 4.5;
const HEIGHT = 900;
const WIDTHS = [
  ['mobile', 360],
  ['desktop', 1440],
] as const;
const BUTTONS = `${HOST}[data-state="enhanced"] .pp-milestones__select`;

async function axe(engine: Launched, base: string, enhanced: boolean): Promise<Row[]> {
  const rows: Row[] = [];
  for (const [viewport, width] of WIDTHS) {
    const where = at(engine.name, `${enhanced ? 'avec' : 'sans'} 3D, ${width} px`);
    const reducedMotion = enhanced ? 'no-preference' : 'reduce';
    const { context, page } = await openPage(engine.browser, base, { viewport, reducedMotion });
    try {
      await page.setViewportSize({ width, height: HEIGHT });
      if (enhanced) await untilEnhanced(page);
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const ids = violations.map((violation) => violation.id).join(', ');
      rows.push(row(where, 'axe', violations.length === 0, ids || 'aucune violation'));
    } finally {
      await context.close();
    }
  }
  return rows;
}

/** Parcourt la liste à la touche Tab (les liens sont franchis) et rend les libellés atteints. */
async function tabThrough(page: Page, count: number): Promise<Set<string>> {
  const reached = new Set<string>();
  await page.locator(BUTTONS).first().focus();
  for (let i = 0; i < count; i += 1) {
    reached.add(await page.evaluate(() => document.activeElement?.textContent ?? ''));
    do await page.keyboard.press('Tab');
    while (await page.evaluate(() => document.activeElement?.tagName === 'A'));
  }
  return reached;
}

async function keyboard(page: Page, engine: string): Promise<Row[]> {
  const where = at(engine, 'clavier');
  const buttons = page.locator(BUTTONS);
  const count = await buttons.count();
  const reached = await tabThrough(page, count);
  await buttons.nth(1).focus();
  const outline = await buttons.nth(1).evaluate((el) => {
    const style = getComputedStyle(el);
    return `${style.outlineStyle} ${style.outlineWidth}`;
  });
  await page.keyboard.press('Enter');
  const pressed = await buttons.nth(1).getAttribute('aria-pressed');
  const panel = ((await page.locator(`${HOST} [data-pp-panel]`).textContent()) ?? '').trim();
  return [
    row(
      where,
      'tous les jalons atteignables',
      reached.size === count,
      `${reached.size} sur ${count} boutons par Tab`,
    ),
    row(
      where,
      'Entrée choisit le jalon',
      pressed === 'true' && panel.length > 0,
      `aria-pressed=${pressed}, panneau ${panel.length} car.`,
    ),
    row(
      where,
      'focus visible',
      !outline.startsWith('none') && !outline.endsWith(' 0px'),
      `contour ${outline}`,
    ),
  ];
}

async function panelContrast(page: Page, engine: string): Promise<Row> {
  const tokens = await resolveTokens(page);
  const ratio = contrast(tokens.fg, tokens.surface);
  return row(
    at(engine, 'panneau'),
    'contraste du texte',
    ratio >= MIN_TEXT_CONTRAST,
    `fg/surface ${ratio.toFixed(2)}:1 (1.4.3 : 4.5:1)`,
  );
}

export async function auditA11y(engine: Launched, base: string): Promise<Row[]> {
  const rows = [...(await axe(engine, base, false)), ...(await axe(engine, base, true))];
  const { context, page } = await openPage(engine.browser, base);
  try {
    await untilEnhanced(page);
    rows.push(...(await keyboard(page, engine.name)), await panelContrast(page, engine.name));
  } finally {
    await context.close();
  }
  return rows;
}
