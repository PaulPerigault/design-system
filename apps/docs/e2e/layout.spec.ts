import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * CSS réellement appliqué aux primitives de layout (getComputedStyle) : attrape un sélecteur
 * scopé d'Astro qui n'atteindrait pas les enfants passés par `<slot />`.
 */

/** Valeur calculée (px) d'un token de longueur, résolue par une sonde dans la page. */
const resolveLength = (page: Page, token: string) =>
  page.evaluate((name) => {
    const probe = document.createElement('div');
    probe.style.marginBlockStart = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).marginBlockStart;
    probe.remove();
    return value;
  }, token);

const resolveSpace = (page: Page, space: string) => resolveLength(page, `--pp-space-${space}`);

/** Attribut `data-*` de chaque élément du sélecteur, dans l'ordre du document. */
const dataOf = (page: Page, selector: string, name: string) =>
  page
    .locator(selector)
    .evaluateAll(
      (elements, attribute) => elements.map((el) => el.getAttribute(attribute)),
      `data-${name}`,
    );

const computed = (page: Page, selector: string, property: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), property);

test('Stack : 1er enfant sans marge, suivants espacés par le token choisi', async ({ page }) => {
  await page.goto('/components/stack/');
  const stack = page.locator('.pp-stack').first();
  const space = (await stack.getAttribute('data-space')) ?? 'm';
  const expected = await resolveSpace(page, space);
  expect(expected).not.toBe('0px');
  expect(await computed(page, '.pp-stack > :first-child', 'margin-block-start')).toBe('0px');
  expect(await computed(page, '.pp-stack > :nth-child(2)', 'margin-block-start')).toBe(expected);
});

test('Cluster : gap égal au token choisi', async ({ page }) => {
  await page.goto('/components/cluster/');
  const space = (await page.locator('.pp-cluster').first().getAttribute('data-space')) ?? 'm';
  const expected = await resolveSpace(page, space);
  expect(expected).not.toBe('0px');
  expect(await computed(page, '.pp-cluster', 'column-gap')).toBe(expected);
});

test('Grid : display grid', async ({ page }) => {
  await page.goto('/components/grid/');
  expect(await computed(page, '.pp-grid', 'display')).toBe('grid');
});

test('Container : max-inline-size égale au token de largeur choisi', async ({ page }) => {
  await page.goto('/components/container/');
  const widths = await dataOf(page, '.pp-container', 'width');
  expect(widths.length).toBeGreaterThan(0);
  for (const [index, width] of widths.entries()) {
    const actual = await page
      .locator('.pp-container')
      .nth(index)
      .evaluate((el) => getComputedStyle(el).maxInlineSize);
    expect(actual).toBe(await resolveLength(page, `--pp-size-${width ?? 'page'}`));
  }
});

for (const name of ['sidebar', 'switcher']) {
  test(`${name} : flex-wrap wrap`, async ({ page }) => {
    await page.goto(`/components/${name}/`);
    expect(await computed(page, `.pp-${name}`, 'flex-wrap')).toBe('wrap');
  });
}

test('Center : marges en ligne automatiques (égales)', async ({ page }) => {
  await page.goto('/components/center/');
  const start = await computed(page, '.pp-center', 'margin-inline-start');
  const end = await computed(page, '.pp-center', 'margin-inline-end');
  expect(start).toBe(end);
  const measure = await resolveLength(page, '--pp-size-measure');
  expect(await computed(page, '.pp-center', 'max-inline-size')).toBe(measure);
});
