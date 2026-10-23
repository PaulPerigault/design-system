import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const PATH = '/recherche/';

test('aucun script Pagefind avant le premier focus', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  await page.goto(PATH);
  expect(requested.filter((url) => url.includes('/pagefind/'))).toEqual([]);
  await page.locator('#docs-search-input').focus();
  await expect
    .poll(() => requested.some((url) => url.includes('/pagefind/pagefind.js')))
    .toBe(true);
});

test('« Dialog » mène à la page Dialog, annoncé et atteignable au clavier', async ({ page }) => {
  await page.goto(PATH);
  const input = page.getByRole('searchbox', { name: 'Rechercher dans la documentation' });
  await input.fill('Dialog');
  const status = page.getByRole('status');
  await expect(status).toContainText(/\d+ résultats? pour « Dialog »/);
  const results = page
    .getByRole('list')
    .filter({ has: page.locator('a[href="/components/dialog/"]') });
  await expect(results.locator('a[href="/components/dialog/"]').first()).toBeVisible();
  await expect(input).toBeFocused();

  await page.keyboard.press('Tab'); // bouton « Rechercher »
  await page.keyboard.press('Tab'); // premier résultat
  await expect(results.getByRole('link').first()).toBeFocused();
});

test('Échap vide le champ et les résultats', async ({ page }) => {
  await page.goto(PATH);
  const input = page.locator('#docs-search-input');
  await input.fill('Dialog');
  await expect(page.getByRole('status')).toContainText('Dialog');
  await input.press('Escape');
  await expect(input).toHaveValue('');
  await expect(page.getByRole('status')).toHaveText('');
  await expect(input).toBeFocused();
});

test('axe : aucune violation, avec et sans résultats', async ({ page }) => {
  await page.goto(PATH);
  const audit = () => new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect((await audit()).violations).toEqual([]);
  await page.locator('#docs-search-input').fill('Dialog');
  await expect(page.getByRole('status')).toContainText('résultat');
  expect((await audit()).violations).toEqual([]);
});
