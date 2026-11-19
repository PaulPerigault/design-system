import { describe, expect, it } from 'vitest';
import { parseDuration, parseEasing } from '../src/css-values.ts';
import { SAMPLES } from './fixtures/samples.ts';

describe('durées', () => {
  it('lit les millisecondes et les secondes', () => {
    expect(parseDuration('160ms')).toBe(160);
    expect(parseDuration('0ms')).toBe(0);
    expect(parseDuration('0.16s')).toBe(160);
    expect(parseDuration(' 1s ')).toBe(1000);
    expect(parseDuration('.5s')).toBe(500);
  });

  it('refuse tout le reste', () => {
    for (const text of ['', '160', '0', '-1ms', '1m', 'ms', 'calc(1ms)', '1 ms', 'auto']) {
      expect(parseDuration(text), text).toBeNull();
    }
  });

  it('lit les trois moteurs : texte brut du jeton et durée de transition calculée', () => {
    for (const { version, raw } of SAMPLES) {
      expect(parseDuration(raw['--pp-duration-base'] ?? ''), version).toBe(160);
      expect(parseDuration(raw['--pp-duration-fast'] ?? ''), version).toBe(100);
      expect(parseDuration(raw['transitionDuration'] ?? ''), version).toBe(160);
    }
  });
});

describe('courbes', () => {
  it('lit cubic-bezier(), espacé ou non', () => {
    expect(parseEasing('cubic-bezier(0.2, 0, 0, 1)')).toEqual([0.2, 0, 0, 1]);
    expect(parseEasing('cubic-bezier(0.2,0,0,1)')).toEqual([0.2, 0, 0, 1]);
    expect(parseEasing(' CUBIC-BEZIER( 0.2 , 0 , 0 , 1 ) ')).toEqual([0.2, 0, 0, 1]);
    expect(parseEasing('cubic-bezier(.4, -0.5, .2, 1.5)')).toEqual([0.4, -0.5, 0.2, 1.5]);
  });

  it('lit les mots-clés de CSS Easing', () => {
    expect(parseEasing('linear')).toEqual([0, 0, 1, 1]);
    expect(parseEasing('ease')).toEqual([0.25, 0.1, 0.25, 1]);
    expect(parseEasing('ease-in')).toEqual([0.42, 0, 1, 1]);
    expect(parseEasing('ease-out')).toEqual([0, 0, 0.58, 1]);
    expect(parseEasing('ease-in-out')).toEqual([0.42, 0, 0.58, 1]);
  });

  it('rend null pour une courbe non reconnue ou invalide', () => {
    const unknown = [
      '',
      'steps(4)',
      'cubic-bezier(1, 2, 3)',
      'cubic-bezier(0.2, 0, 0, 1, 1)',
      'cubic-bezier(1.2, 0, 0, 1)',
      'cubic-bezier(0.2, 0, -0.1, 1)',
      'cubic-bezier(a, b, c, d)',
      'constructor',
      'spring(1)',
    ];
    for (const text of unknown) expect(parseEasing(text), text).toBeNull();
  });

  it('lit le jeton brut et la courbe de transition des trois moteurs', () => {
    for (const { version, raw } of SAMPLES) {
      expect(parseEasing(raw['--pp-easing-standard'] ?? ''), version).toEqual([0.2, 0, 0, 1]);
      expect(parseEasing(raw['timing'] ?? ''), version).toEqual([0.2, 0, 0, 1]);
    }
  });
});
