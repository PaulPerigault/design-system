// Relève, dans Chromium, Firefox et WebKit, ce que `getComputedStyle` rend pour les jetons du thème
// et pour les formes de couleur CSS courantes, puis écrit `test/fixtures/computed-colors.json`.
// Les tests du parseur rejouent ces valeurs : ce sont celles de vrais moteurs, pas des suppositions.
//
// Usage : `node packages/milestones-3d/scripts/capture-colors.mjs` (après
// `npx playwright install chromium firefox webkit`). `PP_ENGINES=chromium,webkit` en limite le relevé.
// Les versions relevées sont dans le fichier.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium, firefox, webkit } from '@playwright/test';

const CSS = new URL('../../tokens/generated/tokens.css', import.meta.url);
const OUT = new URL('../test/fixtures/computed-colors.json', import.meta.url);
const TOKENS = ['bg', 'fg', 'accent', 'on-accent', 'line', 'muted'];
const RAW = [
  '--pp-color-accent',
  '--pp-duration-base',
  '--pp-duration-fast',
  '--pp-easing-standard',
];
const FORMS = [
  'oklch(47% 0.19 270.7)',
  'oklch(0.5 0.1 120deg)',
  'oklch(50% 0.1 0.5turn)',
  'oklch(0.5 0.1 none)',
  'oklch(0.5 0.1 270 / 0.5)',
  'rgb(10 20 30)',
  'rgb(10, 20, 30)',
  'rgba(10, 20, 30, 0.5)',
  'rgb(10 20 30 / 50%)',
  '#336699',
  '#369',
  'rebeccapurple',
  'transparent',
  'color(srgb 0.2 0.4 0.6)',
  'color(display-p3 0.2 0.4 0.6)',
  'color(srgb-linear 0.2 0.4 0.6)',
  'color(rec2020 0.2 0.4 0.6)',
  'lab(50% 20 30)',
  'lch(50% 30 270)',
  'oklab(0.5 0.1 -0.1)',
  'hsl(210 50% 40%)',
  'color-mix(in oklch, oklch(47% 0.19 270.7) 50%, white)',
  'color-mix(in srgb, red 50%, blue)',
  'hwb(200 20% 30%)',
  'oklch(1.2 0.5 270)',
  'oklch(0.99 0.4 270)',
];

/** Exécuté dans la page : sonde sans transition (une transition fausserait la couleur lue). */
function probe({ tokens, raw, forms }) {
  const out = { tokens: {}, forms: {}, raw: {} };
  const el = document.createElement('span');
  el.style.transition = 'none';
  document.documentElement.append(el);
  for (const scheme of ['light', 'dark']) {
    document.documentElement.dataset.theme = scheme;
    out.tokens[scheme] = {};
    for (const t of tokens) {
      el.style.color = `var(--pp-color-${t})`;
      out.tokens[scheme][t] = getComputedStyle(el).color;
    }
  }
  const style = getComputedStyle(document.documentElement);
  for (const name of raw) out.raw[name] = style.getPropertyValue(name);
  el.style.transition = 'color var(--pp-duration-base)';
  out.raw.transitionDuration = getComputedStyle(el).transitionDuration;
  el.style.transition = 'color 1s var(--pp-easing-standard)';
  out.raw.timing = getComputedStyle(el).transitionTimingFunction;
  el.style.transition = 'none';
  for (const form of forms) {
    el.style.color = '';
    el.style.color = form;
    out.forms[form] = el.style.color === '' ? '(refusé)' : getComputedStyle(el).color;
  }
  return out;
}

const engines = [
  ['chromium', chromium],
  ['firefox', firefox],
  ['webkit', webkit],
];
const html = `<!doctype html><meta charset="utf-8"><style>${readFileSync(CSS, 'utf8')}</style>`;
const wanted = (process.env.PP_ENGINES ?? 'chromium,firefox,webkit').split(',');
const samples = [];
for (const [engine, type] of engines.filter(([name]) => wanted.includes(name))) {
  const browser = await type.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const result = await page.evaluate(probe, { tokens: TOKENS, raw: RAW, forms: FORMS });
  samples.push({ engine, version: `${engine} ${browser.version()}`, ...result });
  await browser.close();
}
writeFileSync(OUT, `${JSON.stringify(samples, null, 2)}\n`);
console.log(`capture-colors : ${samples.map((s) => s.version).join(', ')}`);
