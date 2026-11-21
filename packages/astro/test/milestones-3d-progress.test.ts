import { describe, expect, it } from 'vitest';
import {
  isNear,
  nearestIndex,
  scrollProgress,
  scrollTarget,
  spacing,
  stepIndex,
} from '../src/behaviors/milestones-3d-progress';

const VIEWPORT = 800;
const HEIGHT = 3000;

describe('scrollProgress', () => {
  it('vaut 0 quand le haut de la piste touche le haut de l’écran, et avant', () => {
    expect(scrollProgress(0, HEIGHT, VIEWPORT)).toBe(0);
    expect(scrollProgress(500, HEIGHT, VIEWPORT)).toBe(0);
  });

  it('vaut 1 quand le bas de la piste touche le bas de l’écran, et après', () => {
    expect(scrollProgress(-(HEIGHT - VIEWPORT), HEIGHT, VIEWPORT)).toBe(1);
    expect(scrollProgress(-5000, HEIGHT, VIEWPORT)).toBe(1);
  });

  it('est la fraction de défilement entre les deux, dans les deux sens', () => {
    expect(scrollProgress(-1100, HEIGHT, VIEWPORT)).toBeCloseTo(0.5);
    expect(scrollProgress(-550, HEIGHT, VIEWPORT)).toBeCloseTo(0.25);
  });

  it('vaut 0 quand la piste n’est pas plus haute que l’écran (aucune division par zéro)', () => {
    expect(scrollProgress(-10, VIEWPORT, VIEWPORT)).toBe(0);
    expect(scrollProgress(-10, 100, VIEWPORT)).toBe(0);
  });
});

describe('scrollTarget', () => {
  const track = { top: 1000, height: HEIGHT };

  it('retrouve la position de défilement qui donne cette progression', () => {
    expect(scrollTarget(0, track, VIEWPORT)).toBe(1000);
    expect(scrollTarget(1, track, VIEWPORT)).toBe(1000 + HEIGHT - VIEWPORT);
    const y = scrollTarget(0.4, track, VIEWPORT);
    expect(scrollProgress(track.top - y, HEIGHT, VIEWPORT)).toBeCloseTo(0.4);
  });

  it('borne la progression et ne dépasse jamais la piste', () => {
    expect(scrollTarget(-1, track, VIEWPORT)).toBe(1000);
    expect(scrollTarget(2, track, VIEWPORT)).toBe(1000 + HEIGHT - VIEWPORT);
    expect(scrollTarget(0.5, { top: 100, height: 200 }, VIEWPORT)).toBe(100);
  });
});

describe('étape la plus proche', () => {
  const marks = [0, 0.25, 0.5, 1];

  it('choisit l’abscisse la plus proche, la première en cas d’égalité', () => {
    expect(nearestIndex(marks, 0.1)).toBe(0);
    expect(nearestIndex(marks, 0.2)).toBe(1);
    expect(nearestIndex(marks, 0.375)).toBe(1);
    expect(nearestIndex(marks, 0.9)).toBe(3);
    expect(nearestIndex([0.5], 0.9)).toBe(0);
  });

  it('mesure l’écart minimal entre étapes, 1 pour une seule', () => {
    expect(spacing(marks)).toBe(0.25);
    expect(spacing([0.4])).toBe(1);
    expect(spacing([])).toBe(1);
  });

  it('affiche le panneau au voisinage d’une étape seulement', () => {
    expect(isNear(marks, 1, 0.25)).toBe(true);
    expect(isNear(marks, 1, 0.3)).toBe(true);
    expect(isNear(marks, 1, 0.4)).toBe(false);
    expect(isNear(marks, 9, 0.4)).toBe(false);
  });
});

describe('stepIndex', () => {
  it('avance et recule sans boucler', () => {
    expect(stepIndex(1, 1, 4)).toBe(2);
    expect(stepIndex(0, -1, 4)).toBe(0);
    expect(stepIndex(3, 1, 4)).toBe(3);
    expect(stepIndex(2, Number.MAX_SAFE_INTEGER, 4)).toBe(3);
    expect(stepIndex(2, -Number.MAX_SAFE_INTEGER, 4)).toBe(0);
  });
});
