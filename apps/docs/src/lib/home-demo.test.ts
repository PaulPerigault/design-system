import { describe, expect, it } from 'vitest';
import { decisionDataset, decisionKpi, decisionTotals } from './home-demo.ts';

const LOG = [
  '| Id | Date | Décision |',
  '| --- | --- | --- |',
  '| D-001 | 2026-10-20 | a |',
  '| D-002 | 2026-10-20 | b |',
  '| D-003 | 2026-10-22 | c |',
  'texte hors tableau',
  '| D-004 | 2026-10-21 | d |',
].join('\n');

describe('décisions du journal', () => {
  it('cumule par jour, dans l’ordre des dates', () => {
    expect(decisionTotals(LOG)).toEqual([
      { date: '2026-10-20', total: 2 },
      { date: '2026-10-21', total: 3 },
      { date: '2026-10-22', total: 4 },
    ]);
  });

  it('ignore l’en-tête et les lignes sans date', () => {
    expect(decisionTotals('| Id | Date |\n| --- | --- |\n| D-1 | non |')).toEqual([]);
  });

  it('construit un jeu de données valide pour LineChart', () => {
    const data = decisionDataset(decisionTotals(LOG));
    expect(data.x).toEqual({
      kind: 'time',
      label: 'Jour',
      values: ['2026-10-20', '2026-10-21', '2026-10-22'],
    });
    expect(data.series[0]?.values).toEqual([2, 3, 4]);
  });

  it('donne la valeur du dernier jour et la référence du jour précédent', () => {
    expect(decisionKpi(decisionTotals(LOG))).toEqual({
      value: 4,
      reference: 3,
      date: '2026-10-22',
    });
    expect(decisionKpi([{ date: '2026-10-20', total: 2 }])).toEqual({
      value: 2,
      reference: null,
      date: '2026-10-20',
    });
    expect(decisionKpi([])).toBeNull();
  });
});
