// Performance mesurée dans Chromium (CPU ralenti 4 fois, 4G lente) : LCP, CLS, INP, poids transféré,
// instanciation du `.wasm`, première image, temps d'image moyen et p95, tâches longues à l'init.
// Comparaison du LCP avec le rendu classique seul (mouvement réduit), jamais de seuil sur le poids.
import type { Page } from '@playwright/test';
import type { Launched } from './browser.ts';
import { openPage, untilEnhanced, wake } from './browser.ts';
import { IDLE_WAIT_MS, at, info, row, skip } from './model.ts';
import type { Row, Where } from './model.ts';
import { INSTRUMENT, frameStats, readMetrics } from './perf-page.ts';
import type { Metrics } from './perf-page.ts';

const CPU_SLOWDOWN = 4;
const SLOW_4G = { latency: 150, downloadThroughput: 204_800, uploadThroughput: 96_000 };
const MAX_CLS = 0.1;
const LCP_TOLERANCE = 1.1;
const LCP_SLACK_MS = 100;
const CLICK_SAMPLE_MS = 1_000;

/** Ralentit le processeur et le réseau (le poids se mesure à part, voir `transferred`). */
async function throttle(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, ...SLOW_4G });
}

/** Octets reçus (en-têtes et corps compressé) par toutes les requêtes terminées de la page. */
function transferred(page: Page): () => Promise<number> {
  const sizes: Promise<number>[] = [];
  page.on('requestfinished', (request) => {
    sizes.push(request.sizes().then((s) => s.responseBodySize + s.responseHeadersSize));
  });
  return async () => (await Promise.all(sizes)).reduce((sum, bytes) => sum + bytes, 0);
}

async function measure(engine: Launched, base: string, classic: boolean): Promise<Metrics> {
  const reducedMotion = classic ? 'reduce' : 'no-preference';
  const scenario = { viewport: 'mobile', reducedMotion, wake: false, freshVisit: true } as const;
  const { context, page } = await openPage(engine.browser, base, scenario, INSTRUMENT);
  try {
    const received = transferred(page);
    await throttle(page);
    // Navigation neuve (pas de rechargement) : l'ancre de la démonstration est honorée, la section est à l'écran.
    const url = page.url();
    await page.goto('about:blank');
    await page.goto(url);
    if (!classic) await wake(page);
    if (!classic) await untilEnhanced(page);
    await page.waitForTimeout(IDLE_WAIT_MS);
    if (!classic) {
      void page.locator('.pp-milestones__select').nth(1).click();
      await frameStats(page, CLICK_SAMPLE_MS);
    }
    return { ...(await readMetrics(page)), bytes: await received() };
  } finally {
    await context.close();
  }
}

const ms = (value: number | null): string => (value === null ? 'n/a' : `${value.toFixed(0)} ms`);

function lcpAndLayout(where: Where, classic: Metrics, enhanced: Metrics): Row[] {
  const [a, b] = [classic.lcp, enhanced.lcp];
  const kept = a === null || b === null || b <= a * LCP_TOLERANCE + LCP_SLACK_MS;
  return [
    row(where, 'LCP non dégradé', kept, `${ms(a)} → ${ms(b)} (classique → 3D)`),
    row(
      where,
      'CLS ≤ 0,1',
      enhanced.cls <= MAX_CLS,
      `classique ${classic.cls.toFixed(3)}, 3D ${enhanced.cls.toFixed(3)}${enhanced.shifts.length > 0 ? ' : ' + enhanced.shifts.join(' ; ') : ''}`,
    ),
    info(where, 'poids transféré', `${classic.bytes} → ${enhanced.bytes} octets (classique → 3D)`),
  ];
}

function runtime(where: Where, m: Metrics): Row[] {
  const count = m.longTasksAtInit.length;
  const longest = count === 0 ? 0 : Math.max(...m.longTasksAtInit);
  return [
    info(where, 'INP (clic sur un jalon)', ms(m.inp)),
    info(where, 'instanciation du .wasm', ms(m.wasm)),
    info(where, 'première image', ms(m.firstFrame)),
    info(where, 'temps d’image moyen / p95', `${ms(m.frameAvg)} / ${ms(m.frameP95)}`),
    row(
      where,
      'aucune tâche longue à l’init',
      count === 0,
      count === 0 ? 'aucune' : `${count} tâche(s), max ${ms(longest)}`,
    ),
  ];
}

export async function auditPerf(engine: Launched, base: string): Promise<Row[]> {
  const where = at(engine.name, 'mobile, CPU x4, 4G lente');
  if (engine.name !== 'chromium') return [skip(where, 'mesures', 'CDP : Chromium seulement')];
  const classic = await measure(engine, base, true);
  const enhanced = await measure(engine, base, false);
  return [...lcpAndLayout(where, classic, enhanced), ...runtime(where, enhanced)];
}
