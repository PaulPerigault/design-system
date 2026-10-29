import { readFileSync } from 'node:fs';
import tokens from '@paulperigault/tokens/tokens.json';
import { describe, expect, it } from 'vitest';
import { HEIGHT, WIDTH } from '../src/data/chart/frame.ts';

const ROOT_FONT_PX = 16;
/** Plancher de taille du texte d'axe et de légende des graphiques (décision de Paul, 2026-10-29). */
const MIN_CHART_TEXT_PX = 12;
const PHONE_SCREEN_PX = 375;
/** Largeur d'un graphique de la documentation sur un écran de 375 px (mesurée en navigateur). */
const PHONE_CHART_PX = 309;

const read = (path: string): string =>
  readFileSync(new URL(`../src/data/${path}`, import.meta.url), 'utf8');
const base: Readonly<Record<string, string>> = tokens.base;

/** Taille affichée d'un texte SVG : sa taille en unités du viewBox mise à l'échelle du tracé. */
const renderedPx = (units: number, viewBoxWidth: number, displayedWidth: number): number =>
  (units * displayedWidth) / viewBoxWidth;

const axisTextUnits = (): number => {
  const match = /^([\d.]+)rem$/.exec(base['--pp-font-size--1'] ?? '');
  if (!match) throw new Error('--pp-font-size--1 : valeur en rem attendue.');
  return Number(match[1]) * ROOT_FONT_PX;
};

describe('taille du texte des graphiques', () => {
  it('calcule la taille affichée à partir du viewBox', () => {
    expect(renderedPx(14.4, 420, 309)).toBeCloseTo(10.59, 2);
    expect(renderedPx(14.4, 360, 309)).toBeCloseTo(12.36, 2);
  });

  it('les graduations et les valeurs sont en --pp-font-size--1 (le calcul vaut pour elles)', () => {
    expect(read('chart-base.css')).toMatch(
      /\[class\$='__tick'\] \{[^}]*font-size: var\(--pp-font-size--1\)/,
    );
    expect(read('bar-chart.css')).toMatch(/__value \{[^}]*font-size: var\(--pp-font-size--1\)/);
  });

  it(`texte d'axe ≥ ${MIN_CHART_TEXT_PX} px sur un écran de ${PHONE_SCREEN_PX} px`, () => {
    expect(renderedPx(axisTextUnits(), WIDTH, PHONE_CHART_PX)).toBeGreaterThanOrEqual(
      MIN_CHART_TEXT_PX,
    );
  });

  it('garde un gabarit plus large que haut (les courbes se lisent en largeur)', () => {
    expect(WIDTH).toBeGreaterThan(HEIGHT);
  });
});
