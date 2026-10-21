import { expect, test } from '@playwright/test';
import { PAGES } from './helpers';

/** 1.4.10 : 320 px CSS de large, soit un zoom de 400 % sur 1280 px. */
const REFLOW = { width: 320, height: 640 };
const DESKTOP = { width: 1280, height: 800 };
/** 1.4.4 : texte agrandi à 200 % sans zoom de page. */
const TEXT_200 = 'html { font-size: 200% !important; }';
const EPSILON = 1;

const overflow = () => document.documentElement.scrollWidth - innerWidth;

/** Texte masqué par un débordement coupé (même contrôle que 1.4.12). */
function clipped(): string[] {
  const CLIPPING = ['hidden', 'clip'];
  return [...document.body.querySelectorAll<HTMLElement>('*')]
    .filter((el) =>
      [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()),
    )
    .filter((el) => {
      const style = getComputedStyle(el);
      const clips = CLIPPING.includes(style.overflowX) || CLIPPING.includes(style.overflowY);
      return (
        clips && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)
      );
    })
    .map((el) => `${el.tagName} « ${(el.textContent ?? '').trim().slice(0, 30)} »`);
}

/** Règles `:hover` qui font apparaître un contenu (display, visibility, opacity) : 1.4.13. */
function hoverReveals(): string[] {
  const REVEAL = /^(display|visibility|opacity)$/;
  const rules: CSSStyleRule[] = [];
  const walk = (list: CSSRuleList) => {
    for (const rule of list) {
      if (rule instanceof CSSStyleRule) rules.push(rule);
      if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of document.styleSheets) walk(sheet.cssRules);
  return rules
    .filter((rule) => rule.selectorText.includes(':hover'))
    .filter((rule) => [...rule.style].some((property) => REVEAL.test(property)))
    .map((rule) => rule.selectorText);
}

for (const path of PAGES) {
  test(`1.4.10, 320 px sans défilement horizontal : ${path}`, async ({ page }) => {
    await page.setViewportSize(REFLOW);
    await page.goto(path);
    expect(await page.evaluate(overflow)).toBeLessThanOrEqual(EPSILON);
    expect(await page.evaluate(clipped)).toEqual([]);
  });

  test(`1.4.4, texte à 200 % sans perte : ${path}`, async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto(path);
    await page.addStyleTag({ content: TEXT_200 });
    expect(await page.evaluate(overflow)).toBeLessThanOrEqual(EPSILON);
    expect(await page.evaluate(clipped)).toEqual([]);
  });

  test(`1.4.13, aucun contenu révélé au seul survol : ${path}`, async ({ page }) => {
    await page.goto(path);
    expect(await page.evaluate(hoverReveals)).toEqual([]);
  });
}

test('canari : une règle :hover qui révèle un contenu est détectée', async ({ page }) => {
  await page.goto('/components/stack/');
  await page.addStyleTag({ content: '.canari:hover .info { display: block; }' });
  await page.setViewportSize(REFLOW);
  await page.addStyleTag({ content: 'main { min-inline-size: 400px; }' });
  expect(await page.evaluate(hoverReveals)).toContain('.canari:hover .info');
  expect(await page.evaluate(overflow)).toBeGreaterThan(EPSILON);
});
