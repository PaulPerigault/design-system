// Lighthouse (version épinglée, lancée par npx : aucune dépendance du dépôt) sur la page de
// démonstration, profil mobile (CPU ralenti 4 fois, 4G lente), avant (rendu classique seul, mouvement
// réduit forcé) et après (3D active : l'ancre met la section à l'écran, un clavier simulé la réveille, voir server.ts). Mesures, jamais de seuil
// sur le poids ; seule une régression d'accessibilité échoue.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { DEMO_HASH, PAGE, at, info, row, skip } from './model.ts';
import type { Row } from './model.ts';

export const LIGHTHOUSE_VERSION = '13.6.0';
const RUN_TIMEOUT_MS = 180_000;
const MAX_OUTPUT_BYTES = 16_000_000;
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'] as const;
const THROTTLING = [
  '--throttling.cpuSlowdownMultiplier=4',
  '--throttling.rttMs=150',
  '--throttling.throughputKbps=1638.4',
];
/**
 * Sous Linux (runner CI, conteneur), Chrome ne démarre pas sans `--no-sandbox` (espaces de noms
 * utilisateur restreints) ni avec un `/dev/shm` minuscule : chrome-launcher conclut alors « waiting
 * for dynamic debugging port » (CI #396). Playwright pose les mêmes options à ses propres lancements.
 */
const LINUX_FLAGS = ['--no-sandbox', '--disable-dev-shm-usage'];
export const platformFlags = (platform: string): string[] =>
  platform === 'linux' ? LINUX_FLAGS : [];
const FLAGS = [
  '--headless=new',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--use-gl=angle',
];

interface Report {
  categories: Record<string, { score: number | null }>;
  audits: Record<string, { numericValue?: number }>;
}

/** Windows passe par un shell, qui exige les guillemets ; ailleurs, ils resteraient dans l'argument. */
const quoted = (value: string): string => (process.platform === 'win32' ? `"${value}"` : value);

function command(url: string, out: string, extra: string[]): string[] {
  return [
    '--yes',
    `lighthouse@${LIGHTHOUSE_VERSION}`,
    url,
    '--quiet',
    '--output=json',
    `--output-path=${out}`,
    `--only-categories=${CATEGORIES.join(',')}`,
    '--form-factor=mobile',
    ...THROTTLING,
    `--chrome-flags=${quoted([...FLAGS, ...platformFlags(process.platform), ...extra].join(' '))}`,
  ];
}

const execFileAsync = promisify(execFile);

/** Asynchrone : le serveur de l'audit vit dans ce processus, qu'un appel bloquant gèlerait. */
async function run(url: string, out: string, extra: string[]): Promise<Report | string> {
  try {
    await execFileAsync('npx', command(url, out, extra), {
      shell: process.platform === 'win32',
      timeout: RUN_TIMEOUT_MS,
      maxBuffer: MAX_OUTPUT_BYTES,
      env: { ...process.env, CHROME_PATH: chromium.executablePath() },
    });
    return JSON.parse(readFileSync(out, 'utf8')) as Report;
  } catch (error) {
    const text = String((error as { stderr?: string }).stderr || error);
    const lines = text.split('\n').filter((line) => line && !line.startsWith('npm warn'));
    return `Lighthouse a échoué : ${lines.slice(0, 3).join(' | ') || 'sans message'}`;
  }
}

const score = (r: Report, key: string): number => Math.round((r.categories[key]?.score ?? 0) * 100);
const value = (r: Report, key: string): number => r.audits[key]?.numericValue ?? 0;
const scores = (r: Report): string => CATEGORIES.map((c) => `${c} ${score(r, c)}`).join(', ');
const vitals = (r: Report): string =>
  `${value(r, 'largest-contentful-paint').toFixed(0)} ms / ${value(r, 'cumulative-layout-shift').toFixed(3)} / ${value(r, 'total-blocking-time').toFixed(0)} ms`;

export async function auditLighthouse(base: string, outDir: string): Promise<Row[]> {
  const where = at('chromium', 'Lighthouse mobile, CPU x4, 4G lente');
  mkdirSync(outDir, { recursive: true });
  const url = `${base}${PAGE}${DEMO_HASH}`;
  const woken = `${base}${PAGE}?wake${DEMO_HASH}`;
  const before = await run(url, join(outDir, 'lighthouse-classique.json'), [
    '--force-prefers-reduced-motion',
  ]);
  const after = await run(woken, join(outDir, 'lighthouse-3d.json'), []);
  if (typeof before === 'string') return [skip(where, 'Lighthouse', before)];
  if (typeof after === 'string') return [skip(where, 'Lighthouse', after)];
  return [
    info(where, 'scores avant (classique)', scores(before)),
    info(where, 'scores après (3D)', scores(after)),
    row(
      where,
      'accessibilité sans régression',
      score(after, 'accessibility') >= score(before, 'accessibility'),
      `${score(before, 'accessibility')} → ${score(after, 'accessibility')}`,
    ),
    info(where, 'LCP / CLS / TBT avant', vitals(before)),
    info(where, 'LCP / CLS / TBT après', vitals(after)),
    info(
      where,
      'poids transféré avant → après',
      `${value(before, 'total-byte-weight')} → ${value(after, 'total-byte-weight')} octets`,
    ),
  ];
}
