import { describe, expect, it } from 'vitest';
import { GOAL, MILESTONES, items, many, render } from './Milestones3D.fixtures';

describe('Milestones3D (bloc de données)', () => {
  const dataOf = async (props: Record<string, unknown> = {}): Promise<unknown> => {
    const script = (await render(props)).querySelector('script[data-pp-data]');
    expect(script?.getAttribute('type')).toBe('application/json');
    return JSON.parse(script?.textContent ?? 'null');
  };

  it('sérialise les mêmes jalons que la liste, plus la cible', async () => {
    expect(await dataOf({ goal: GOAL })).toEqual({ milestones: MILESTONES, goal: GOAL });
    expect(await dataOf()).toEqual({ milestones: MILESTONES });
  });

  it('échappe < : un libellé ne peut pas fermer le bloc', async () => {
    const hostile = [{ id: 'x', label: '</script><b>', status: 'planned' }];
    const root = await render({ milestones: hostile });
    expect(root.querySelector('script')?.textContent).not.toContain('</script');
    expect(await dataOf({ milestones: hostile })).toEqual({ milestones: hostile });
  });
});

describe('Milestones3D (cas limites)', () => {
  it('rend un seul jalon', async () => {
    expect(items(await render({ milestones: many(1) }))).toHaveLength(1);
  });

  it('rend 24 jalons, le maximum de la scène, dans l’ordre', async () => {
    const lis = items(await render({ milestones: many(24) }));
    expect(lis).toHaveLength(24);
    expect(lis.at(-1)?.querySelector('strong')?.textContent).toBe('Jalon 23');
  });

  it('garde un libellé très long entier, sans le tronquer', async () => {
    const label = 'Certification '.repeat(40).trim();
    const root = await render({ milestones: [{ id: 'long', label, status: 'achieved' }] });
    expect(root.querySelector('strong')?.textContent).toBe(label);
  });

  it('omet date, groupe et lien absents, sans texte de remplacement', async () => {
    const root = await render({ milestones: [{ id: 'nu', label: 'Nu', status: 'planned' }] });
    expect(root.querySelector('time')).toBeNull();
    expect(root.querySelector('.pp-milestones__group')).toBeNull();
    expect(root.querySelector('li a')).toBeNull();
  });

  it('affiche telle quelle une date qui n’existe pas, sans datetime', async () => {
    const bad = [{ id: 'd', label: 'D', status: 'planned', date: '2026-02-30' }];
    const time = (await render({ milestones: bad })).querySelector('time');
    expect(time?.textContent).toBe('2026-02-30');
    expect(time?.hasAttribute('datetime')).toBe(false);
  });

  it('ne rend aucun jalon pour une liste vide (la scène, elle, la refuse)', async () => {
    expect(items(await render({ milestones: [] }))).toHaveLength(0);
  });
});
