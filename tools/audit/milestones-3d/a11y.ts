// Accessibilité : axe avec et sans 3D (360 et 1440 px), clavier (keyboard.ts), contraste du panneau
// de détail.
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import type { Launched } from './browser.ts';
import { openPage, untilEnhanced } from './browser.ts';
import { resolveTokens } from './colors.ts';
import { auditKeyboard } from './keyboard.ts';
import { at, row } from './model.ts';
import type { Row } from './model.ts';
import { contrast } from './pixels.ts';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const MIN_TEXT_CONTRAST = 4.5;
const HEIGHT = 900;
const WIDTHS = [
  ['mobile', 360],
  ['desktop', 1440],
] as const;

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
    rows.push(...(await auditKeyboard(page, engine.name)), await panelContrast(page, engine.name));
  } finally {
    await context.close();
  }
  return rows;
}
