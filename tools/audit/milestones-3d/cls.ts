// Décalage de mise en page à l'activation (ADR-0014) : scène prête 3 s après l'activation,
// processeur ralenti six fois, par défilement et par geste, sur grand et petit écran. Le défilement
// n'est pas une entrée récente pour la mesure : seule une empreinte identique avant et après
// l'activation donne un CLS nul. Chromium seulement (`layout-shift` n'existe pas ailleurs).
import type { Browser, Page } from '@playwright/test';
import type { Launched } from './browser.ts';
import { ENHANCE_TIMEOUT_MS, HOST, PAGE, VIEWPORTS, at, row } from './model.ts';
import type { Row, Where } from './model.ts';

export const SCENE_DELAY_MS = 3_000;
export const CPU_SLOWDOWN = 6;
export const CLS_TOLERANCE = 0.01;
const SETTLE_MS = 2_500;
const POLL_MS = 500;
const WHEEL_STEP = 120;
const WHEEL_PAUSE_MS = 40;
const SECTION_SHARE = 0.6;

const OBSERVER = `
  window.__shifts = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__shifts.push(entry.value);
  }).observe({ type: 'layout-shift', buffered: true });
`;

type Mode = 'défilement' | 'geste';
type Viewport = keyof typeof VIEWPORTS;

/** Somme des décalages (hors entrée récente) relevés dans la page. */
export const shiftsOf = (page: Page): Promise<number> =>
  page.evaluate(() =>
    (window as unknown as { __shifts: number[] }).__shifts.reduce((sum, value) => sum + value, 0),
  );

async function approach(page: Page, mode: Mode, height: number): Promise<void> {
  const demo = page.locator('[data-milestones-demo]');
  if (mode === 'geste') {
    await demo.scrollIntoViewIfNeeded();
    return;
  }
  const top = await demo.evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
  for (let y = 0; y < top - height * SECTION_SHARE; y += WHEEL_STEP) {
    await page.mouse.wheel(0, WHEEL_STEP);
    await page.waitForTimeout(WHEEL_PAUSE_MS);
  }
}

async function untilState(page: Page, mode: Mode, state: string): Promise<boolean> {
  const deadline = Date.now() + ENHANCE_TIMEOUT_MS * 2;
  while (Date.now() < deadline) {
    if (mode === 'geste') await page.keyboard.press('Shift');
    const current = await page.locator(HOST).getAttribute('data-state');
    if (current === state) return true;
    await page.waitForTimeout(POLL_MS);
  }
  return false;
}

async function measure(browser: Browser, base: string, viewport: Viewport, mode: Mode) {
  const context = await browser.newContext({ viewport: VIEWPORTS[viewport] });
  try {
    await context.route('**/*.wasm', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, SCENE_DELAY_MS));
      await route.continue();
    });
    await context.addInitScript(OBSERVER);
    const page = await context.newPage();
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });
    await page.goto(`${base}${PAGE}`);
    await approach(page, mode, VIEWPORTS[viewport].height);
    const enhanced = await untilState(page, mode, 'enhanced');
    await page.waitForTimeout(SETTLE_MS);
    return { enhanced, cls: await shiftsOf(page) };
  } finally {
    await context.close();
  }
}

export async function auditShift(engine: Launched, base: string): Promise<Row[]> {
  if (engine.name !== 'chromium') {
    const where: Where = at(engine.name, 'décalage de mise en page');
    return [
      { ...where, check: 'CLS', status: 'skip', detail: "layout-shift n'existe que sous Chromium" },
    ];
  }
  const rows: Row[] = [];
  for (const viewport of ['desktop', 'mobile'] as const) {
    for (const mode of ['défilement', 'geste'] as const) {
      const where = at(engine.name, `CLS, ${viewport}, par ${mode}`);
      const { enhanced, cls } = await measure(engine.browser, base, viewport, mode);
      const detail = `${cls.toFixed(4)} (scène prête après ${SCENE_DELAY_MS / 1000} s, CPU x${CPU_SLOWDOWN})`;
      rows.push(row(where, 'CLS nul à l’activation', enhanced && cls <= CLS_TOLERANCE, detail));
    }
  }
  return rows;
}
