import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * CSS réellement appliqué aux primitives de layout (getComputedStyle) : attrape un sélecteur
 * scopé d'Astro qui n'atteindrait pas les enfants passés par `<slot />`.
 */

/** Valeur calculée (px) d'un token d'espacement, résolue par une sonde dans la page. */
const resolveSpace = (page: Page, space: string) =>
  page.evaluate((name) => {
    const probe = document.createElement('div');
    probe.style.marginBlockStart = `var(--pp-space-${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).marginBlockStart;
    probe.remove();
    return value;
  }, space);

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

test('Cluster : gap non nul', async ({ page }) => {
  await page.goto('/components/cluster/');
  const gap = await computed(page, '.pp-cluster', 'column-gap');
  expect(gap).not.toBe('normal');
  expect(gap).not.toBe('0px');
});

test('Grid : display grid', async ({ page }) => {
  await page.goto('/components/grid/');
  expect(await computed(page, '.pp-grid', 'display')).toBe('grid');
});

test('Container : max-inline-size bornée', async ({ page }) => {
  await page.goto('/components/container/');
  expect(await computed(page, '.pp-container', 'max-inline-size')).not.toBe('none');
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
  expect(await computed(page, '.pp-center', 'max-inline-size')).not.toBe('none');
});
