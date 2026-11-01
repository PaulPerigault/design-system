import { gzipSync } from 'node:zlib';
import { expect, test } from '@playwright/test';
import type { CDPSession, Page } from '@playwright/test';
import { readInp } from './inp';
import { injectVitals, readCls } from './web-vitals';

/**
 * Repères de L12 (docs/benchmark/gap.md), mesurés sur un téléphone d'entrée de gamme. Ce sont des
 * mesures affichées, jamais des seuils qui font échouer le test (D-106, ADR-0006 décision 5).
 */
const REFERENCES = 'LCP 2500 ms, CLS 0,1, INP 200 ms, JavaScript 1 Kio gzip, 2 fichiers de police';

/** Appareil : 360 × 800, tactile ; CPU ×4 plus lent ; « Slow 4G » (latence 150 ms, 1,6 Mbit/s). */
const VIEWPORT = { width: 360, height: 800 };
const CPU_SLOWDOWN = 4;
const LATENCY_MS = 150;
const BITS_PER_BYTE = 8;
const DOWNLOAD_BITS_PER_S = 1_600_000;
const UPLOAD_BITS_PER_S = 750_000;
const TEST_TIMEOUT_MS = 90_000;

const PAGES = ['/', '/components/button/', '/tableau-de-bord/', '/sobriete/'];
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

for (const path of PAGES) {
  test(`mesure mobile (360 × 800, CPU ×4, Slow 4G) : ${path}`, async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT_MS);
    const responses = trackResponses(page);
    await throttle(page);
    await injectVitals(page);
    await page.goto(path, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    const inp = await readInp(page);
    const measures = {
      LCP: `${Math.round(await readLcp(page))} ms`,
      INP: `${Math.round(inp.duration)} ms (attente, traitement, rendu ${inp.parts.map(Math.round)})`,
      CLS: (await readCls(page)).toFixed(3),
      'JavaScript gzip': `${await responses.scriptBytes()} o`,
      'fichiers de police': String(responses.fonts.length),
    };
    // Affichée dans le rapport Playwright ; aucun seuil. Les runners GitHub (2 vCPU, rendu
    // logiciel) ajoutent ~200 ms d'attente à l'INP (D-021) : une valeur, pas un verdict.
    for (const [type, value] of Object.entries(measures)) {
      test.info().annotations.push({ type, description: `${value} (repère : ${REFERENCES})` });
    }

    const preloads = page.locator('link[rel=preload][as=font]');
    await expect(preloads).toHaveCount(1);
    const href = await preloads.getAttribute('href');
    // Fonctionnement, pas budget : le corps est préchargé et sa police est chargée.
    expect(responses.fonts, 'la police du corps est préchargée').toContain(
      new URL(href ?? '', page.url()).href,
    );
    const body = await page.evaluate((family) => {
      const loaded = [...document.fonts].some((f) => f.family === family && f.status === 'loaded');
      return { loaded, stack: getComputedStyle(document.body).fontFamily };
    }, BODY_FONT);
    expect(body.loaded).toBe(true);
    expect(body.stack).toContain(BODY_FONT);
  });
}
