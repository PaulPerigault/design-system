// Console et réseau : zéro erreur et zéro avertissement, `.wasm` en `application/wasm` compressé en
// brotli avec un cache long, aucune requête tierce. L'avertissement du rastériseur logiciel de
// Chromium est compté à part : il vient du navigateur, pas de la page (vérifié avec un canvas vide).
import type { Page, Response } from '@playwright/test';
import type { Launched } from './browser.ts';
import { openPage, untilEnhanced } from './browser.ts';
import { IDLE_WAIT_MS, at, isEngineNoise, info, row, skip } from './model.ts';
import type { Row, Where } from './model.ts';

const YEAR_SECONDS = 31_536_000;

interface Seen {
  problems: string[];
  noise: number;
  wasm: Response[];
  hosts: Set<string>;
  /** Encodages annoncés par le moteur (première requête : le flux du .wasm n'expose pas l'en-tête). */
  accept?: Promise<string | null>;
}

function watch(page: Page, seen: Seen): void {
  page.on('console', (message) => {
    if (!['error', 'warning'].includes(message.type())) return;
    if (isEngineNoise(message.text())) seen.noise += 1;
    else seen.problems.push(`${message.type()} : ${message.text().slice(0, 120)}`);
  });
  page.on('pageerror', (error) => seen.problems.push(`exception : ${error.message.slice(0, 120)}`));
  page.on('requestfailed', (request) => seen.problems.push(`requête échouée : ${request.url()}`));
  page.on('request', (request) => {
    if (/^https?:/.test(request.url())) seen.hosts.add(new URL(request.url()).host);
  });
  page.on('response', (response) => {
    if (response.url().endsWith('.wasm')) seen.wasm.push(response);
    else seen.accept ??= response.request().headerValue('accept-encoding');
  });
}

const maxAgeOf = (cache: string): number => Number(/max-age=(\d+)/.exec(cache)?.[1] ?? 0);

function wasmRows(where: Where, response: Response | undefined, offered: boolean): Row[] {
  if (!response) return [skip(where, '.wasm', 'aucun .wasm chargé (construction sans .wasm)')];
  const headers = response.headers();
  const cache = headers['cache-control'] ?? '';
  const long = maxAgeOf(cache) >= YEAR_SECONDS && /immutable/.test(cache);
  return [
    row(
      where,
      '.wasm en application/wasm',
      headers['content-type'] === 'application/wasm',
      headers['content-type'] ?? 'absent',
    ),
    offered
      ? row(
          where,
          '.wasm compressé en brotli',
          headers['content-encoding'] === 'br',
          headers['content-encoding'] ?? 'non compressé',
        )
      : skip(
          where,
          '.wasm compressé en brotli',
          'le moteur n’annonce pas br en http local (WebKit : seulement en https)',
        ),
    row(where, '.wasm en cache long', long, cache || 'absent'),
  ];
}

function rowsOf(engine: string, base: string, seen: Seen, offered: boolean): Row[] {
  const consoleAt = at(engine, 'console');
  const netAt = at(engine, 'réseau');
  const host = new URL(base).host;
  const foreign = [...seen.hosts].filter((other) => other !== host);
  const rows = [
    row(
      consoleAt,
      'zéro erreur, zéro avertissement',
      seen.problems.length === 0,
      seen.problems.join(' | ') || 'console propre',
    ),
    row(netAt, 'aucune requête tierce', foreign.length === 0, foreign.join(', ') || `seul ${host}`),
    ...wasmRows(netAt, seen.wasm[0], offered),
  ];
  if (seen.noise > 0)
    rows.push(
      info(
        consoleAt,
        'bruit du navigateur',
        `${seen.noise} message(s) GPU stall ou contexte relâché ou capteur, hors page`,
      ),
    );
  return rows;
}

export async function auditNetwork(engine: Launched, base: string): Promise<Row[]> {
  const seen: Seen = { problems: [], noise: 0, wasm: [], hosts: new Set() };
  const { context, page } = await openPage(engine.browser, base, {}, (p) => watch(p, seen));
  try {
    await untilEnhanced(page);
    await page.waitForTimeout(IDLE_WAIT_MS);
    return rowsOf(engine.name, base, seen, /\bbr\b/.test((await seen.accept) ?? ''));
  } finally {
    await context.close();
  }
}
