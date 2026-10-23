import { expect, test, type Page } from '@playwright/test';
import { REQUIRED_HEADERS } from '../scripts/headers/policy.mjs';
import { PAGES, VIEWPORTS, setTheme } from './helpers';

const SEARCH_PATH = '/recherche/';
const MENU_PATH = '/components/button/';
const CSP_CONSOLE = /content security policy|refused to (apply|execute|load|connect|create)/i;
const WINDOW_KEY = '__cspViolations';

test.use({ bypassCSP: false });

type Watcher = { violations: () => Promise<string[]> };

/** Capte les `securitypolicyviolation` (init script) et les messages console de type CSP. */
async function watch(page: Page): Promise<Watcher> {
  const consoleHits: string[] = [];
  page.on('console', (message) => {
    if (CSP_CONSOLE.test(message.text())) consoleHits.push(message.text());
  });
  await page.addInitScript((key) => {
    const store: string[] = [];
    (window as unknown as Record<string, string[]>)[key] = store;
    document.addEventListener('securitypolicyviolation', (event) => {
      store.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  }, WINDOW_KEY);
  return {
    violations: async () => [
      ...((await page.evaluate(
        (key) => (window as unknown as Record<string, string[]>)[key],
        WINDOW_KEY,
      )) ?? []),
      ...consoleHits,
    ],
  };
}

for (const path of PAGES) {
  test(`CSP et en-têtes de sécurité sans violation : ${path}`, async ({ page }) => {
    const watcher = await watch(page);
    const response = await page.goto(path);
    const headers = response?.headers() ?? {};
    for (const name of REQUIRED_HEADERS) {
      expect(headers[name.toLowerCase()], name).toBeTruthy();
    }
    expect(headers['content-security-policy']).toContain("default-src 'none'");
    await page.waitForLoadState('load');
    expect(await watcher.violations()).toEqual([]);
  });
}

test('la recherche (Pagefind, WebAssembly) fonctionne sans violation', async ({ page }) => {
  const watcher = await watch(page);
  await page.goto(SEARCH_PATH);
  await page.getByRole('searchbox', { name: 'Rechercher dans la documentation' }).fill('Dialog');
  await expect(page.getByRole('status')).toContainText(/\d+ résultats? pour « Dialog »/);
  const results = page
    .getByRole('list')
    .filter({ has: page.locator('a[href="/components/dialog/"]') });
  await expect(results.locator('a[href="/components/dialog/"]').first()).toBeVisible();
  expect(await watcher.violations()).toEqual([]);
});

test('le mode sombre s’applique sans violation', async ({ page }) => {
  const watcher = await watch(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(MENU_PATH);
  await setTheme(page, 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await watcher.violations()).toEqual([]);
});

test('le menu mobile s’ouvre sans violation', async ({ page }) => {
  const watcher = await watch(page);
  const mobile = VIEWPORTS.find((viewport) => viewport.name === 'mobile');
  await page.setViewportSize({ width: mobile?.width ?? 0, height: mobile?.height ?? 0 });
  await page.goto(MENU_PATH);
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.locator('#docs-menu')).toHaveAttribute('open', '');
  expect(await watcher.violations()).toEqual([]);
});
