// Une mesure de page dans Chromium : CPU ralenti, réseau lent, observateurs de perf-page.ts, et
// éventuellement une trace du fil principal (perf-trace.ts) pour expliquer une tâche longue.
import type { CDPSession, Page } from '@playwright/test';
import type { Launched } from './browser.ts';
import { openPage, untilEnhanced, wake } from './browser.ts';
import { IDLE_WAIT_MS } from './model.ts';
import { INSTRUMENT, frameStats, readMetrics } from './perf-page.ts';
import type { Metrics } from './perf-page.ts';
import { recordTrace, summarizeTrace } from './perf-trace.ts';

export interface Mode {
  /** Rendu classique seul (mouvement réduit) plutôt que la 3D. */
  classic: boolean;
  throttled?: boolean;
  traced?: boolean;
}

const CPU_SLOWDOWN = 4;
const SLOW_4G = { latency: 150, downloadThroughput: 204_800, uploadThroughput: 96_000 };
const CLICK_SAMPLE_MS = 1_000;

/** Ralentit le processeur et le réseau (le poids se mesure à part, voir `transferred`). */
async function throttle(page: Page): Promise<CDPSession> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, ...SLOW_4G });
  return cdp;
}

/** Octets reçus (en-têtes et corps compressé) par toutes les requêtes terminées de la page. */
function transferred(page: Page): () => Promise<number> {
  const sizes: Promise<number>[] = [];
  page.on('requestfinished', (request) => {
    sizes.push(request.sizes().then((s) => s.responseBodySize + s.responseHeadersSize));
  });
  return async () => (await Promise.all(sizes)).reduce((sum, bytes) => sum + bytes, 0);
}

export async function measure(
  engine: Launched,
  base: string,
  mode: Mode,
): Promise<Metrics & { trace?: string }> {
  const { classic, throttled = true, traced = false } = mode;
  const reducedMotion = classic ? 'reduce' : 'no-preference';
  const scenario = { viewport: 'mobile', reducedMotion, wake: false, freshVisit: true } as const;
  const { context, page } = await openPage(engine.browser, base, scenario, INSTRUMENT);
  try {
    const received = transferred(page);
    const cdp = throttled ? await throttle(page) : null;
    const run = async (): Promise<void> => {
      // Navigation neuve (pas de rechargement) : l'ancre de la démonstration est honorée, la section est à l'écran.
      const url = page.url();
      await page.goto('about:blank');
      await page.goto(url);
      if (!classic) await wake(page);
      if (!classic) await untilEnhanced(page);
      await page.waitForTimeout(IDLE_WAIT_MS);
      if (!classic) await click(page);
    };
    const events = traced && cdp ? await recordTrace(cdp, run) : (await run(), null);
    const trace = events ? summarizeTrace(events) : undefined;
    return { ...(await readMetrics(page)), bytes: await received(), trace };
  } finally {
    await context.close();
  }
}

async function click(page: Page): Promise<void> {
  void page.locator('.pp-milestones__select').nth(1).click();
  await frameStats(page, CLICK_SAMPLE_MS);
  await frameStats(page, CLICK_SAMPLE_MS);
}
