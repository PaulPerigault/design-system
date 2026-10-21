// Observation ciblée de pages publiques (L11) : une page par acteur, sans connexion, robots.txt
// respecté, arrêt sur une page protégée. Usage : node tools/benchmark/observe.mjs <sites.json> <sortie.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import * as measure from './measure.mjs';
import { robotsAllows } from './robots.mjs';

const VIEWPORTS = {
  mobile: {
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  },
  desktop: { viewport: { width: 1440, height: 900 } },
};
const SETTLE_MS = 2500;
const TIMEOUT_MS = 30000;
const BLOCKED =
  /just a moment|captcha|access denied|are you a robot|verify you are human|attention required/i;

async function observePage(browser, url, profile) {
  const context = await browser.newContext({ ...profile, locale: 'fr-FR', colorScheme: 'light' });
  const page = await context.newPage();
  try {
    const response = await page.goto(url, { waitUntil: 'load', timeout: TIMEOUT_MS });
    await page.waitForTimeout(SETTLE_MS);
    const status = response?.status() ?? 0;
    if (status >= 400 || BLOCKED.test(await page.title()))
      return { blocked: `HTTP ${status}, ${await page.title()}` };
    const result = {
      finalUrl: page.url(),
      targets: await page.evaluate(measure.targets),
      body: await page.evaluate(measure.bodyText),
      chrome: await page.evaluate(measure.chrome),
      resources: await page.evaluate(measure.resources),
      lightBackground: await page.evaluate(measure.background),
    };
    await page.emulateMedia({ colorScheme: 'dark' });
    result.darkBackground = await page.evaluate(measure.background);
    await page.keyboard.press('Tab');
    result.focus = await page.evaluate(measure.focusVisible);
    return result;
  } catch (error) {
    return { error: String(error.message ?? error).split('\n')[0] };
  } finally {
    await context.close();
  }
}

async function observeSite(browser, site) {
  if (!(await robotsAllows(site.url))) return { ...site, skipped: 'robots.txt' };
  const mobile = await observePage(browser, site.url, VIEWPORTS.mobile);
  if (mobile.blocked) return { ...site, mobile };
  const desktop = await observePage(browser, site.url, VIEWPORTS.desktop);
  return { ...site, mobile, desktop };
}

if (import.meta.main) {
  const [input, output] = process.argv.slice(2);
  const sites = JSON.parse(readFileSync(input, 'utf8'));
  const browser = await chromium.launch();
  const results = [];
  for (const site of sites) {
    results.push(await observeSite(browser, site));
    console.log(`${site.name} : ${JSON.stringify(results.at(-1)).length} octets`);
  }
  await browser.close();
  writeFileSync(
    output,
    `${JSON.stringify({ observedAt: new Date().toISOString(), results }, null, 2)}\n`,
  );
}
