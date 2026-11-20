// Lighthouse (version épinglée, lancée par npx : aucune dépendance du dépôt) sur la page de
// démonstration, profil mobile (CPU ralenti 4 fois, 4G lente), avant (rendu classique seul, mouvement
// réduit forcé) et après (3D active : l'ancre met la section à l'écran, un clavier simulé la réveille, voir server.ts). Mesures, jamais de seuil
// sur le poids ; seule une régression d'accessibilité échoue.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { DEMO_HASH, PAGE, at, info, row, skip } from './model.ts';
import type { Row } from './model.ts';

export const LIGHTHOUSE_VERSION = '13.6.0';
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'] as const;
const THROTTLING = [
  '--throttling.cpuSlowdownMultiplier=4',
  '--throttling.rttMs=150',
  '--throttling.throughputKbps=1638.4',
];
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
    `--chrome-flags="${[...FLAGS, ...extra].join(' ')}"`,
  ];
}

function run(url: string, out: string, extra: string[]): Report | string {
  const result = spawnSync('npx', command(url, out, extra), {
    shell: process.platform === 'win32',
    encoding: 'utf8',
    env: { ...process.env, CHROME_PATH: chromium.executablePath() },
  });
  if (result.status === 0) return JSON.parse(readFileSync(out, 'utf8')) as Report;
  const message = (result.stderr || result.stdout).split('\n').find(Boolean) ?? 'sans message';
  return `Lighthouse a échoué : ${message}`;
}

const score = (r: Report, key: string): number => Math.round((r.categories[key]?.score ?? 0) * 100);
const value = (r: Report, key: string): number => r.audits[key]?.numericValue ?? 0;
const scores = (r: Report): string => CATEGORIES.map((c) => `${c} ${score(r, c)}`).join(', ');
const vitals = (r: Report): string =>
  `${value(r, 'largest-contentful-paint').toFixed(0)} ms / ${value(r, 'cumulative-layout-shift').toFixed(3)} / ${value(r, 'total-blocking-time').toFixed(0)} ms`;

export function auditLighthouse(base: string, outDir: string): Row[] {
  const where = at('chromium', 'Lighthouse mobile, CPU x4, 4G lente');
  mkdirSync(outDir, { recursive: true });
  const url = `${base}${PAGE}${DEMO_HASH}`;
  const woken = `${base}${PAGE}?wake${DEMO_HASH}`;
  const before = run(url, join(outDir, 'lighthouse-classique.json'), [
    '--force-prefers-reduced-motion',
  ]);
  const after = run(woken, join(outDir, 'lighthouse-3d.json'), []);
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
