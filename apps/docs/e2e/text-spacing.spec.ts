import { expect, test } from '@playwright/test';
import { PAGES, VIEWPORTS, open } from './helpers';

// Valeurs imposées par WCAG 2.2, critère 1.4.12 (espacement du texte).
const SPACING_CSS = `
  * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
  p { margin-block-end: 2em !important; }
`;

interface Problem {
  tag: string;
  text: string;
  reason: string;
}

/** Éléments de texte qui débordent ou dont le texte est masqué (exécuté dans la page). */
function findProblems(): Problem[] {
  const TOLERANCE = 1;
  const CLIPPING = ['hidden', 'clip'];
  const hasText = (el: Element) =>
    [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
  const isBox = (el: HTMLElement) => !['inline', 'none'].includes(getComputedStyle(el).display);
  const reasons = (el: HTMLElement) => {
    const style = getComputedStyle(el);
    const clips = CLIPPING.includes(style.overflowY) || CLIPPING.includes(style.overflowX);
    return [
      el.scrollWidth > el.clientWidth + TOLERANCE ? 'débordement horizontal' : '',
      clips && el.scrollHeight > el.clientHeight + TOLERANCE ? 'texte masqué' : '',
    ].filter(Boolean);
  };
  return [...document.body.querySelectorAll<HTMLElement>('*')]
    .filter((el) => hasText(el) && isBox(el))
    .flatMap((el) => {
      const text = (el.textContent ?? '').trim().slice(0, 60);
      return reasons(el).map((reason) => ({ tag: el.tagName, text, reason }));
    });
}

for (const path of PAGES) {
  for (const viewport of VIEWPORTS) {
    test(`espacement du texte : ${path}, ${viewport.name}`, async ({ page }) => {
      await open(page, path, viewport);
      await page.addStyleTag({ content: SPACING_CSS });
      expect(await page.evaluate(findProblems)).toEqual([]);
    });
  }
}
