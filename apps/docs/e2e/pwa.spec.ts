import { expect, test, type Page } from '@playwright/test';
import { PAGES } from './helpers';

const OK = 200;
const MANIFEST_PATH = '/manifest.webmanifest';
const SW_PATH = '/sw.js';
const VISITED = '/glossaire/';
const OFFLINE_PAGE = '/identite/';
const NEVER_VISITED = '/credits/';
const SMALL_ICON = '192x192';
const LARGE_ICON = '512x512';
const WINDOW_KEY = '__cspViolations';

// La CSP du site est rétablie : le service worker doit fonctionner sous la politique réelle.
test.use({ bypassCSP: false });

interface Icon {
  src: string;
  sizes: string;
  purpose?: string;
}

/** Capte les `securitypolicyviolation` de chaque document chargé par la page. */
async function watchCsp(page: Page): Promise<() => Promise<string[]>> {
  await page.addInitScript((key) => {
    const store: string[] = [];
    (window as unknown as Record<string, string[]>)[key] = store;
    document.addEventListener('securitypolicyviolation', (event) => {
      store.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  }, WINDOW_KEY);
  return async () =>
    (await page.evaluate(
      (key) => (window as unknown as Record<string, string[]>)[key],
      WINDOW_KEY,
    )) ?? [];
}

/** Attend l'activation du service worker et le contrôle de la page (recharge si besoin). */
async function controlled(page: Page): Promise<void> {
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload();
  }
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
}

test('le manifeste est complet et ses icônes répondent en PNG', async ({ page, request }) => {
  const response = await request.get(MANIFEST_PATH);
  expect(response.status()).toBe(OK);
  expect(response.headers()['content-type']).toContain('application/manifest+json');
  const manifest = await response.json();
  expect(manifest).toMatchObject({ display: 'standalone', lang: 'fr', scope: '/' });
  expect(manifest.name).toBeTruthy();
  expect(manifest.start_url).toBeTruthy();
  const icons: Icon[] = manifest.icons;
  expect(icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining([SMALL_ICON, LARGE_ICON]));
  expect(icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  for (const icon of icons) {
    const iconResponse = await page.request.get(icon.src);
    expect(iconResponse.status(), icon.src).toBe(OK);
    expect(iconResponse.headers()['content-type'], icon.src).toContain('image/png');
  }
});

for (const path of PAGES) {
  test(`le lien vers le manifeste est présent : ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', MANIFEST_PATH);
  });
}

test('le service worker s’enregistre, s’active et se revalide', async ({ page }) => {
  const response = await page.goto(VISITED);
  expect(response?.status()).toBe(OK);
  const scope = await page.evaluate(() =>
    navigator.serviceWorker.ready.then((registration) => registration.scope),
  );
  expect(scope).toBe(`${new URL(page.url()).origin}/`);
  const sw = await page.request.get(SW_PATH);
  expect(sw.status()).toBe(OK);
  expect(sw.headers()['cache-control']).toBe('no-cache');
});

test('une page déjà visitée s’ouvre hors ligne, une page jamais visitée échoue', async ({
  page,
  context,
}) => {
  await page.goto(VISITED);
  await controlled(page);
  await page.goto(OFFLINE_PAGE);
  await context.setOffline(true);
  await page.goto(OFFLINE_PAGE);
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.goto(NEVER_VISITED)).rejects.toThrow();
});

test('aucune collecte ni violation CSP pendant la navigation', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL ?? '').origin;
  const foreign: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (/^https?:$/.test(url.protocol) && url.origin !== origin) foreign.push(request.url());
  });
  const violations = await watchCsp(page);
  await page.goto(VISITED);
  await controlled(page);
  await page.goto(OFFLINE_PAGE);
  await page.waitForLoadState('load');
  expect(await page.evaluate(() => document.cookie)).toBe('');
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(foreign).toEqual([]);
  expect(await violations()).toEqual([]);
});
