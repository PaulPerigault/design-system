import { describe, expect, it } from 'vitest';
import { fitLabel } from '../src/data/chart/labels';

describe('fitLabel', () => {
  it('garde un libellé court tel quel', () => {
    expect(fitLabel('France', 8, 2)).toEqual({
      lines: ['France'],
      full: 'France',
      truncated: false,
    });
  });

  it('revient à la ligne entre les mots', () => {
    const fitted = fitLabel('Ressources humaines', 12, 2);
    expect(fitted.lines).toEqual(['Ressources', 'humaines']);
    expect(fitted.truncated).toBe(false);
  });

  it('tronque la dernière ligne avec une ellipse et signale la troncature', () => {
    const fitted = fitLabel('Service juridique, conformité et protection', 14, 2);
    expect(fitted.lines).toEqual(['Service', 'juridique, co…']);
    expect(fitted.lines).toHaveLength(2);
    expect(fitted.lines[1]?.endsWith('…')).toBe(true);
    expect(fitted.lines.every((line) => line.length <= 14)).toBe(true);
    expect(fitted.truncated).toBe(true);
  });

  it('coupe un mot plus long que la ligne', () => {
    expect(fitLabel('Luxembourg', 7, 1).lines).toEqual(['Luxemb…']);
  });

  it('normalise les espaces', () => {
    expect(fitLabel('  Bas   Rhin ', 20, 1)).toEqual({
      lines: ['Bas Rhin'],
      full: 'Bas Rhin',
      truncated: false,
    });
  });
});
