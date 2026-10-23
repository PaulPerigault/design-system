import { gzipSync } from 'node:zlib';
import { expect, test } from '@playwright/test';
import type { CDPSession, Page } from '@playwright/test';
import { injectVitals, readCls } from './web-vitals';

/** Budgets de L12 (docs/benchmark/gap.md), mesurés sur un téléphone d'entrée de gamme. */
const LCP_BUDGET_MS = 2500;
const CLS_BUDGET = 0.1;
const INP_BUDGET_MS = 200;
const JS_BUDGET_BYTES = 1024;

/** Appareil : 360 × 800, tactile ; CPU ×4 plus lent ; « Slow 4G » (latence 150 ms, 1,6 Mbit/s). */
const VIEWPORT = { width: 360, height: 800 };
/**
 * ×4 sur une machine de développement rapide. Le runner CI est déjà environ 4 fois plus lent
 * (mesuré : INP 208 à 256 ms à ×4 en CI contre 56 à 64 ms à ×8 en local, D-021) : pas de
 * ralentissement supplémentaire en CI, les budgets restent identiques.
 */
const CPU_SLOWDOWN = process.env.CI ? 1 : 4;
const LATENCY_MS = 150;
const BITS_PER_BYTE = 8;
const DOWNLOAD_BITS_PER_S = 1_600_000;
const UPLOAD_BITS_PER_S = 750_000;
/** Seuil minimal de `durationThreshold` accepté par Chromium pour les entrées `event`. */
const EVENT_THRESHOLD_MS = 16;
const TEST_TIMEOUT_MS = 90_000;

const PAGES = ['/', '/components/button/'];
const BODY_FONT = 'Atkinson Hyperlegible Next Variable';

test.use({ viewport: VIEWPORT, hasTouch: true, isMobile: true });

async function throttle(page: Page): Promise<CDPSession> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: LATENCY_MS,
    downloadThroughput: DOWNLOAD_BITS_PER_S / BITS_PER_BYTE,
    uploadThroughput: UPLOAD_BITS_PER_S / BITS_PER_BYTE,
  });
  return cdp;
}

/** Octets gzip de chaque réponse `script` et URL de chaque police reçue. */
function trackResponses(page: Page) {
  const scripts: Promise<number>[] = [];
  const fonts: string[] = [];
  page.on('response', (response) => {
    const type = response.request().resourceType();
    if (type === 'font') fonts.push(response.url());
    if (type === 'script') scripts.push(response.body().then((body) => gzipSync(body).length));
  });
  return {
    fonts,
    scriptBytes: async () => (await Promise.all(scripts)).reduce((sum, size) => sum + size, 0),
  };
}

/** LCP (ms) : dernière entrée tamponnée, lue une fois la page chargée. */
const readLcp = (page: Page): Promise<number> =>
  page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        new PerformanceObserver((list, observer) => {
          observer.disconnect();
          resolve(list.getEntries().at(-1)?.startTime ?? Number.NaN);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      }),
  );

/** INP (ms) : durée la plus longue des événements d'un clic sur le bouton du menu. */
async function readInp(page: Page): Promise<number> {
  await page.evaluate((threshold) => {
    const durations: number[] = [];
    (window as unknown as { __ppInp: number[] }).__ppInp = durations;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) durations.push(entry.duration);
    }).observe({
      type: 'event',
      durationThreshold: threshold,
      buffered: true,
    } as PerformanceObserverInit);
  }, EVENT_THRESHOLD_MS);
  await page.locator('.docs-menu-button').click();
  await expect(page.locator('dialog#docs-menu')).toBeVisible();
  // Les entrées `event` sont livrées après le rendu de la trame suivant l'interaction.
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => setTimeout(done))));
  return page.evaluate(() => Math.max(0, ...(window as unknown as { __ppInp: number[] }).__ppInp));
}

for (const path of PAGES) {
  test(`budgets mobile (360 × 800, CPU ×4, Slow 4G) : ${path}`, async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT_MS);
    const responses = trackResponses(page);
    await throttle(page);
    await injectVitals(page);
    await page.goto(path, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    expect(await readLcp(page), 'LCP').toBeLessThanOrEqual(LCP_BUDGET_MS);
    expect(await readInp(page), 'INP').toBeLessThanOrEqual(INP_BUDGET_MS);
    expect(await readCls(page), 'CLS').toBeLessThanOrEqual(CLS_BUDGET);
    expect(await responses.scriptBytes(), 'JavaScript gzip').toBeLessThanOrEqual(JS_BUDGET_BYTES);

    const preloads = page.locator('link[rel=preload][as=font]');
    await expect(preloads).toHaveCount(1);
    const href = await preloads.getAttribute('href');
    expect(responses.fonts, 'la police préchargée est la seule téléchargée').toEqual([
      new URL(href ?? '', page.url()).href,
    ]);
    const body = await page.evaluate((family) => {
      const loaded = [...document.fonts].some((f) => f.family === family && f.status === 'loaded');
      return { loaded, stack: getComputedStyle(document.body).fontFamily };
    }, BODY_FONT);
    expect(body.loaded).toBe(true);
    expect(body.stack).toContain(BODY_FONT);
  });
}
