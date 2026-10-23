import { expect, test } from '@playwright/test';
import { PAGES, visit } from '../helpers';

/** Taille minimale du texte courant et des champs (Safari iOS zoome sous 16 px). */
const MIN_FONT_PX = 16;
/** Tolérance d'arrondi des largeurs (px). */
const EPSILON = 1;

function report(min: number) {
  const measure = (() => {
    const probe = document.createElement('div');
    probe.style.inlineSize = 'var(--pp-size-measure)';
    document.body.append(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  })();
  const visible = (el: Element) => el.getBoundingClientRect().width > 0;
  const size = (el: Element) => parseFloat(getComputedStyle(el).fontSize);
  const label = (el: Element) => `${el.tagName} « ${(el.textContent ?? '').trim().slice(0, 30)} »`;
  const paragraphs = [...document.querySelectorAll('main p')].filter(visible);
  const fields = [...document.querySelectorAll('main :is(input, select, textarea)')].filter(
    visible,
  );
  return {
    overflow: document.documentElement.scrollWidth - innerWidth,
    smallText: paragraphs.filter((p) => size(p) < min).map(label),
    smallFields: fields.filter((f) => size(f) < min).map((f) => f.id || f.tagName),
    wideParagraphs: paragraphs
      .filter((p) => p.getBoundingClientRect().width > measure + 1)
      .map(label),
  };
}

for (const path of PAGES) {
  test(`mise en page : ${path}`, async ({ page }) => {
    await visit(page, path);
    const viewport = await page.locator('meta[name=viewport]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).not.toMatch(/maximum-scale|user-scalable\s*=\s*(no|0)/);
    const result = await page.evaluate(report, MIN_FONT_PX);
    expect(result.overflow, 'défilement horizontal').toBeLessThanOrEqual(EPSILON);
    expect(result.smallText, 'texte courant < 16 px').toEqual([]);
    expect(result.smallFields, 'champs < 16 px').toEqual([]);
    expect(result.wideParagraphs, 'paragraphes plus larges que la mesure').toEqual([]);
  });
}
