// Échec d'une image (ADR-0013, décision 5) : tous les badges répondent 404. La scène survit, la liste
// garde le nom des jalons, la console ne montre aucune erreur autre que le 404 attendu.
import type { Page } from '@playwright/test';
import type { Launched } from './browser.ts';
import { openPage, untilEnhanced } from './browser.ts';
import { BADGE_URL, BADGE_WAIT_MS } from './badges.ts';
import { HOST, at, brief, isEngineNoise, row } from './model.ts';
import type { Row, Where } from './model.ts';
import { stepNames } from './steps.ts';

/** Message que le navigateur écrit lui-même pour une réponse 404 (le texte varie selon le moteur). */
const NOT_FOUND_NOISE = /404|Failed to load resource|NS_ERROR|not found/i;

/**
 * WebKit avertit d'un préchargement « non utilisé » dès qu'une page porte une interception réseau
 * de Playwright, même sur une adresse sans rapport (vérifié) : artefact de `page.route`, pas du site.
 * Le contrôle « console » sans interception, lui, ne tolère rien.
 */
const INTERCEPTION_NOISE = /preloaded using link preload but not used/;

function listen(page: Page, problems: string[]): void {
  page.on('console', (message) => {
    const text = message.text();
    const bad = ['error', 'warning'].includes(message.type());
    if (
      bad &&
      !isEngineNoise(text) &&
      !NOT_FOUND_NOISE.test(text) &&
      !INTERCEPTION_NOISE.test(text)
    ) {
      problems.push(`${message.type()} : ${text.slice(0, 100)}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`exception : ${error.message.slice(0, 100)}`));
  void page.route(BADGE_URL, (route) => route.fulfill({ status: 404, body: 'introuvable' }));
}

async function rows(page: Page, where: Where, problems: string[]): Promise<Row[]> {
  const canvases = await page.locator(`${HOST} canvas`).count();
  const state = await page.locator(HOST).getAttribute('data-state');
  const names = await stepNames(page);
  const items = await page.locator(`${HOST} .pp-milestones__item`).count();
  const named = names.length === items && names.every((name) => name !== '');
  return [
    row(
      where,
      'la scène survit',
      canvases === 1 && state === 'enhanced',
      `${canvases} canvas, état ${state}`,
    ),
    row(
      where,
      'la liste garde le nom des jalons',
      named,
      `${names.length} étapes nommées pour ${items} jalons`,
    ),
    row(
      where,
      'console sans erreur inattendue',
      problems.length === 0,
      problems.join(' | ') || 'seul le 404 attendu',
    ),
  ];
}

export async function auditBroken(engine: Launched, base: string): Promise<Row[]> {
  const where = at(engine.name, 'image en 404');
  const problems: string[] = [];
  const { context, page } = await openPage(engine.browser, base, {}, (p) => listen(p, problems));
  try {
    await untilEnhanced(page);
    await page.waitForTimeout(BADGE_WAIT_MS);
    return await rows(page, where, problems);
  } catch (error) {
    return [row(where, 'image en 404', false, brief(error))];
  } finally {
    await context.close();
  }
}
