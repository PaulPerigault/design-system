// Moteurs Playwright et scénarios de page. Un moteur absent est une ligne en échec avec la
// commande d'installation : jamais ignoré en silence.
import { chromium, firefox, webkit } from '@playwright/test';
import type { Browser, BrowserContext, Page } from '@playwright/test';
import type { EngineName, Row } from './model.ts';
import { DEMO_HASH, ENGINES, ENHANCED, ENHANCE_TIMEOUT_MS, PAGE } from './model.ts';
import { contextOptions, initScript } from './scenario.ts';
import type { Scenario } from './scenario.ts';

export type { Scenario } from './scenario.ts';

const LAUNCHERS = { chromium, firefox, webkit };
const SOFTWARE_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--use-gl=angle'];

export type Gpu = 'software' | 'default';

export interface LaunchOptions {
  args: string[];
  headless?: boolean;
}

/**
 * Options de lancement d'un moteur. Firefox sans écran sous Linux n'offre pas WebGL2 (liste de
 * blocage, aucun pilote GL) ; avec un écran, il le fournit par défaut. Un affichage défini
 * (`DISPLAY`, par exemple sous `xvfb-run`) le lance donc avec écran. `AUDIT_CHROMIUM_FLAGS` ajoute des
 * options à Chromium (`--headless=new --disable-gpu` imite un runner sans carte graphique : le
 * navigateur compose alors le canvas par lecture des pixels, comme en CI).
 */
export function launchOptions(
  name: EngineName,
  gpu: Gpu,
  env: Readonly<Record<string, string | undefined>>,
): LaunchOptions {
  const base = name === 'chromium' && gpu === 'software' ? SOFTWARE_ARGS : [];
  const extra =
    name === 'chromium' ? (env['AUDIT_CHROMIUM_FLAGS'] ?? '').split(' ').filter(Boolean) : [];
  const args = [...base, ...extra];
  const display = (env['DISPLAY'] ?? '') !== '';
  return name === 'firefox' && display ? { args, headless: false } : { args };
}

export interface Launched {
  name: EngineName;
  browser: Browser;
}

export async function launch(
  names: readonly EngineName[],
  gpu: Gpu = 'software',
): Promise<{ engines: Launched[]; missing: Row[] }> {
  const engines: Launched[] = [];
  const missing: Row[] = [];
  for (const name of names) {
    try {
      const options = launchOptions(name, gpu, process.env);
      engines.push({ name, browser: await LAUNCHERS[name].launch(options) });
    } catch (error) {
      const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
      missing.push({
        engine: name,
        scenario: '-',
        check: 'navigateur',
        status: 'fail',
        detail: `absent (${reason}) : npx playwright install ${name}`,
      });
    }
  }
  return { engines, missing };
}

export const parseEngines = (value: string | undefined): EngineName[] => {
  const asked = (value ?? ENGINES.join(',')).split(',').map((s) => s.trim());
  const unknown = asked.filter((name) => !ENGINES.includes(name as EngineName));
  if (unknown.length > 0) throw new Error(`moteur inconnu : ${unknown.join(', ')}`);
  return asked as EngineName[];
};

/** Un geste discret (touche) : la section de démonstration est à l'écran, la 3D l'attend. */
export async function wake(page: Page): Promise<void> {
  await page.keyboard.press('Shift');
}

const WAKE_RETRY_MS = 400;

/**
 * Attend la scène en renouvelant le geste : le geste d'un instant plus tôt peut précéder la pose des
 * écouteurs de la porte d'attente (l'observateur d'intersection répond en asynchrone).
 */
export async function untilEnhanced(page: Page): Promise<void> {
  const deadline = Date.now() + ENHANCE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if ((await page.locator(ENHANCED).count()) > 0) return;
    await wake(page);
    await page.waitForTimeout(WAKE_RETRY_MS);
  }
  throw new Error("la 3D ne s'active pas dans le délai");
}

export async function openPage(
  browser: Browser,
  base: string,
  scenario: Scenario = {},
  setup?: (page: Page) => void,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext(contextOptions(scenario));
  const script = initScript(scenario);
  if (script) await context.addInitScript(script);
  const page = await context.newPage();
  setup?.(page);
  await page.goto(`${base}${PAGE}${DEMO_HASH}`);
  if (scenario.wake !== false) await wake(page);
  return { context, page };
}
