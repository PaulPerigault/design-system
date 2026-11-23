import { describe, expect, it } from 'vitest';
import type { MilestoneItem } from '../src/content/milestones-3d-model';
import { sortKey, sortMilestones } from '../src/content/milestones-3d-sort';

const m = (id: string, date?: string): MilestoneItem => ({
  id,
  label: id,
  status: 'planned',
  ...(date ? { date } : {}),
});
const order = (list: MilestoneItem[]): string[] => sortMilestones(list).map((x) => x.id);

describe('sortKey', () => {
  it('complète le jour manquant et rend une clé vide pour une date illisible', () => {
    expect(sortKey('2025-03')).toBe('2025-03-00');
    expect(sortKey('2025-03-15')).toBe('2025-03-15');
    expect(sortKey(undefined)).toBe('');
    expect(sortKey('mars 2025')).toBe('');
    expect(sortKey('2026-02-30')).toBe('');
    expect(sortKey('2025-13')).toBe('');
  });
});

describe('sortMilestones', () => {
  it('trie par date croissante', () => {
    expect(order([m('c', '2027-01'), m('a', '2023-05'), m('b', '2025-12')])).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('est stable à date égale, et place un mois avant les jours du mois', () => {
    expect(order([m('x', '2025-03-10'), m('y', '2025-03'), m('z', '2025-03-10')])).toEqual([
      'y',
      'x',
      'z',
    ]);
  });

  it('garde un jalon sans date derrière le jalon qui le précède dans l’ordre fourni', () => {
    const list = [m('late', '2027-01'), m('free'), m('early', '2023-01'), m('free2')];
    expect(order(list)).toEqual(['early', 'free2', 'late', 'free']);
  });

  it('laisse en tête les jalons sans date placés avant tout jalon daté', () => {
    expect(order([m('n'), m('b', '2026-01'), m('a', '2024-01')])).toEqual(['n', 'a', 'b']);
  });

  it('gère une liste vide, sans date, et ne modifie pas l’entrée', () => {
    const input = [m('b', '2026-01'), m('a', '2024-01')];
    expect(order([])).toEqual([]);
    expect(order([m('x'), m('y')])).toEqual(['x', 'y']);
    order(input);
    expect(input.map((x) => x.id)).toEqual(['b', 'a']);
  });
});
