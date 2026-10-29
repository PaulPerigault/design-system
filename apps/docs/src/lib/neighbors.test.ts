import { describe, expect, it } from 'vitest';
import { neighborsOf } from './neighbors.ts';

describe('neighborsOf', () => {
  it('renvoie aucun précédent pour la première page de la navigation', () => {
    const result = neighborsOf('stack');
    expect(result.previous).toBeUndefined();
    expect(result.next?.slug).toBe('cluster');
    expect(result.group.id).toBe('mise-en-page');
  });

  it('renvoie aucun suivant pour la dernière page de la navigation', () => {
    const result = neighborsOf('kpi-card');
    expect(result.previous?.slug).toBe('sparkline');
    expect(result.next).toBeUndefined();
    expect(result.group.id).toBe('donnees');
  });

  it('renvoie le précédent et le suivant au milieu d’un groupe', () => {
    const result = neighborsOf('cluster');
    expect(result.previous?.slug).toBe('stack');
    expect(result.next?.slug).toBe('grid');
  });

  it('enchaîne les groupes : la dernière page de l’un précède la première du suivant', () => {
    expect(neighborsOf('center').next?.slug).toBe('button');
    const button = neighborsOf('button');
    expect(button.previous?.slug).toBe('center');
    expect(button.group.id).toBe('formulaires');
  });

  it('lève une erreur claire pour un slug inconnu', () => {
    expect(() => neighborsOf('inconnu')).toThrow('Page absente de la navigation : « inconnu ».');
  });
});
