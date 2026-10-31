import { gzipSync } from 'node:zlib';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { FIGURE_COUNT, PATH, WCAG_TAGS } from './tableau-de-bord';

/** Budget de poids du HTML (gzip), mesuré à 7 ko le 2026-10-31 : marge d'un peu plus de moitié. */
const HTML_GZIP_BUDGET = 12 * 1024;
/** Couleurs système (CSS Color 4) que le contraste forcé impose aux tracés. */
const SYSTEM_COLORS = [
  'CanvasText',
  'Canvas',
  'GrayText',
  'ButtonText',
  'ButtonFace',
  'ButtonBorder',
  'LinkText',
  'Highlight',
  'HighlightText',
  'Field',
  'FieldText',
];
/** Budget de nœuds SVG par graphique (ADR-0007, décision 2). */
const SVG_NODE_BUDGET = 400;

test('chaque graphique tient dans le budget de nœuds SVG', async ({ page }) => {
  await page.goto(PATH);
  const counts = await page
    .locator('main svg')
    .evaluateAll((svgs) => svgs.map((svg) => svg.querySelectorAll('*').length));
  expect(counts.length).toBeGreaterThanOrEqual(4);
  for (const count of counts) expect(count).toBeLessThanOrEqual(SVG_NODE_BUDGET);
});

test('la page ne charge ni script dans le contenu ni WebAssembly', async ({ page }) => {
  const wasm: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('.wasm')) wasm.push(request.url());
  });
  await page.goto(PATH);
  await expect(page.locator('main script')).toHaveCount(0);
  expect(wasm).toEqual([]);
});

test('budget de poids : le HTML tient dans 12 ko en gzip', async ({ request }) => {
  const body = await (await request.get(PATH)).body();
  expect(gzipSync(body).length).toBeLessThanOrEqual(HTML_GZIP_BUDGET);
});

test.describe('sans JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('tous les graphiques et le tableau s’affichent', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator('main figure')).toHaveCount(FIGURE_COUNT);
    for (const svg of await page.locator('main svg').all()) await expect(svg).toBeVisible();
    await expect(page.locator('main table').last()).toBeVisible();
  });
});

test.describe('mouvement réduit', () => {
  test.use({ reducedMotion: 'reduce' });

  test('aucune animation en cours', async ({ page }) => {
    await page.goto(PATH);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });
});

test.describe('contraste forcé', () => {
  test.use({ forcedColors: 'active' });

  test('aucun tracé ne garde une couleur de palette : seulement des couleurs système', async ({
    page,
  }) => {
    await page.goto(PATH);
    const result = await page.evaluate((names) => {
      const resolve = (name: string): string => {
        const probe = document.createElement('span');
        probe.style.color = name;
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      const system = names.map(resolve);
      const strokes = [...document.querySelectorAll('main svg :is(path, line, circle, rect)')]
        .map((node) => getComputedStyle(node).stroke)
        .filter((stroke) => stroke !== 'none');
      return { system, strokes };
    }, SYSTEM_COLORS);
    expect(result.strokes.length).toBeGreaterThan(0);
    const foreign = result.strokes.filter((stroke) => !result.system.includes(stroke));
    expect([...new Set(foreign)], 'traits hors couleurs système').toEqual([]);
  });

  test('axe : aucune violation', async ({ page }) => {
    await page.goto(PATH);
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});

test.describe('impression', () => {
  test('rien ne déborde de la page imprimée', async ({ page }) => {
    await page.goto(PATH);
    await page.emulateMedia({ media: 'print' });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const hidden = await page
      .locator('main svg')
      .evaluateAll((svgs) => svgs.filter((svg) => svg.getBoundingClientRect().width === 0).length);
    expect(hidden).toBe(0);
  });
});
