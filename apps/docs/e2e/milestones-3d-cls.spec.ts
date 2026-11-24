import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { PATH, hasWasm } from './milestones-3d';

/**
 * Décalage de mise en page (ADR-0014) : la scène est prête 3 s après l'activation, processeur ralenti
 * six fois. Le défilement n'est pas une entrée récente pour la mesure : seule une empreinte
 * identique avant et après l'activation donne un CLS nul, par défilement comme par geste.
 */
const SIZES = [
  { name: 'bureau', width: 1440, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
] as const;
const MODES = ['défilement', 'geste'] as const;
const SCENE_DELAY_MS = 3000;
const CPU_SLOWDOWN = 6;
const TOLERANCE = 0.01;
const SETTLE_MS = 2500;
const POLL_MS = 500;
const TIMEOUT_MS = 120_000;
const WHEEL_STEP = 120;
const HOST = '[data-milestones-demo] [data-pp-milestones]';

async function observeShifts(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const shifts: number[] = [];
    Object.assign(window, { __shifts: shifts });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as {
        value: number;
        hadRecentInput: boolean;
      }[]) {
        if (!entry.hadRecentInput) shifts.push(entry.value);
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
}

async function activateBy(page: Page, mode: (typeof MODES)[number], height: number): Promise<void> {
  const demo = page.locator('[data-milestones-demo]');
  if (mode === 'geste') {
    await demo.scrollIntoViewIfNeeded();
    await page.waitForTimeout(POLL_MS);
    return;
  }
  const top = await demo.evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
  for (let y = 0; y < top - height * 0.6; y += WHEEL_STEP) {
    await page.mouse.wheel(0, WHEEL_STEP);
    await page.waitForTimeout(40);
  }
}

test.describe('CLS nul à l’activation de la scène', () => {
  test.skip(!hasWasm(), 'build sans .wasm');
  test.setTimeout(TIMEOUT_MS);

  for (const size of SIZES) {
    for (const mode of MODES) {
      test(`${size.name}, par ${mode} : scène prête après 3 s, CPU x6`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: size.width, height: size.height },
          isMobile: size.mobile,
          hasTouch: size.mobile,
          bypassCSP: true,
        });
        await context.route('**/*.wasm', async (route) => {
          await new Promise((resolve) => setTimeout(resolve, SCENE_DELAY_MS));
          await route.continue();
        });
        const page = await context.newPage();
        const session = await context.newCDPSession(page);
        await session.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });
        await observeShifts(page);
        await page.goto(PATH);
        await activateBy(page, mode, size.height);
        await expect(async () => {
          if (mode === 'geste') await page.keyboard.press('Shift');
          await expect(page.locator(HOST)).toHaveAttribute('data-state', 'enhanced', {
            timeout: POLL_MS,
          });
        }).toPass({ timeout: TIMEOUT_MS / 2 });
        await page.waitForTimeout(SETTLE_MS);
        const shifts = await page.evaluate(
          () => (window as unknown as { __shifts: number[] }).__shifts,
        );
        expect(shifts.reduce((sum, value) => sum + value, 0)).toBeLessThanOrEqual(TOLERANCE);
        await context.close();
      });
    }
  }
});
