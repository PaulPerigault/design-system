// Fuites après `destroy()` (Chromium, protocole DevTools) : écouteurs de `window` et `document`
// revenus au niveau d'une page où la 3D n'a jamais tourné, aucun canvas conservé après un
// ramasse-miettes.
import type { CDPSession, Page } from '@playwright/test';
import type { Launched } from './browser.ts';
import { openPage, untilEnhanced } from './browser.ts';
import { FALLBACK_MARGIN_MS, IDLE_WAIT_MS, RESTORE_TIMEOUT_MS, at, row, skip } from './model.ts';
import type { Row } from './model.ts';

interface Counts {
  window: number;
  document: number;
  canvases: number;
}

/**
 * Écouteurs posés par la page. Ceux de Playwright (même script que l'écouteur témoin nommé
 * « __playwright_global_listeners_check__ ») servent à piloter les gestes : ils ne comptent pas.
 */
async function listeners(cdp: CDPSession, expression: string): Promise<number> {
  const { result } = await cdp.send('Runtime.evaluate', { expression });
  if (!result.objectId) return 0;
  const { listeners: found } = await cdp.send('DOMDebugger.getEventListeners', {
    objectId: result.objectId,
  });
  const tool = found.find((l) => l.type === '__playwright_global_listeners_check__')?.scriptId;
  return found.filter((l) => tool === undefined || l.scriptId !== tool).length;
}

async function liveCanvases(cdp: CDPSession): Promise<number> {
  await cdp.send('HeapProfiler.collectGarbage');
  const { result } = await cdp.send('Runtime.evaluate', {
    expression: 'HTMLCanvasElement.prototype',
  });
  if (!result.objectId) return 0;
  const { objects } = await cdp.send('Runtime.queryObjects', {
    prototypeObjectId: result.objectId,
  });
  const { result: length } = await cdp.send('Runtime.callFunctionOn', {
    objectId: objects.objectId ?? '',
    functionDeclaration: 'function () { return this.length; }',
  });
  return Number(length.value ?? 0);
}

async function counts(cdp: CDPSession): Promise<Counts> {
  const window = await listeners(cdp, 'window');
  const document = await listeners(cdp, 'document');
  return { window, document, canvases: await liveCanvases(cdp) };
}

/** Niveau de référence : même page, 3D jamais lancée (mouvement réduit). */
async function baseline(engine: Launched, base: string): Promise<Counts> {
  const { context, page } = await openPage(engine.browser, base, { reducedMotion: 'reduce' });
  try {
    await page.waitForTimeout(IDLE_WAIT_MS);
    return await counts(await context.newCDPSession(page));
  } finally {
    await context.close();
  }
}

async function destroyByContextLoss(page: Page): Promise<void> {
  await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-milestones-demo] canvas');
    canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  await page.waitForTimeout(RESTORE_TIMEOUT_MS + FALLBACK_MARGIN_MS);
}

export async function auditLeaks(engine: Launched, base: string): Promise<Row[]> {
  const where = at(engine.name, 'destroy()');
  if (engine.name !== 'chromium')
    return [skip(where, 'fuites', 'protocole DevTools : Chromium seulement')];
  const reference = await baseline(engine, base);
  const { context, page } = await openPage(engine.browser, base);
  try {
    const cdp = await context.newCDPSession(page);
    await untilEnhanced(page);
    await destroyByContextLoss(page);
    const after = await counts(cdp);
    const listenersOk = after.window <= reference.window && after.document <= reference.document;
    return [
      row(
        where,
        'écouteurs retirés',
        listenersOk,
        `window ${reference.window} → ${after.window}, document ${reference.document} → ${after.document}`,
      ),
      row(
        where,
        'aucun canvas conservé',
        after.canvases <= reference.canvases,
        `canvas vivants ${reference.canvases} → ${after.canvases}`,
      ),
    ];
  } finally {
    await context.close();
  }
}
