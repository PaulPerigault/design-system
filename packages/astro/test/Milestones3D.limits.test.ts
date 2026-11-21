import { describe, expect, it } from 'vitest';
import { GOAL, MILESTONES, items, many, render } from './Milestones3D.fixtures';

describe('Milestones3D (bloc de données)', () => {
  const dataOf = async (props: Record<string, unknown> = {}): Promise<unknown> => {
    const script = (await render(props)).querySelector('script[data-pp-data]');
    expect(script?.getAttribute('type')).toBe('application/json');
    return JSON.parse(script?.textContent ?? 'null');
  };

  it('sérialise les jalons triés sans description, plus l’objectif sans description', async () => {
    const data = (await dataOf({ goal: GOAL })) as {
      milestones: Record<string, unknown>[];
      goal: Record<string, unknown>;
    };
    expect(data.milestones.map((m) => m['id'])).toEqual(['alpha', 'beta', 'sans-date', 'gamma']);
    expect(JSON.stringify(data)).not.toContain('description');
    expect(data.milestones[0]).toMatchObject({ code: 'ABC-101', badge: { width: 512 } });
    expect(data.goal).toEqual({
      label: 'Objectif final',
      date: '2027-01',
      href: 'https://example.org/cible',
    });
    expect(Object.keys((await dataOf()) as object)).toEqual(['milestones']);
  });

  it('ne modifie pas le tableau reçu', async () => {
    const before = MILESTONES.map((m) => m.id);
    await render();
    expect(MILESTONES.map((m) => m.id)).toEqual(before);
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

  it('omet date, groupe, code, lien et badge absents, sans texte de remplacement', async () => {
    const root = await render({ milestones: [{ id: 'nu', label: 'Nu', status: 'planned' }] });
    expect(root.querySelector('time')).toBeNull();
    expect(root.querySelector('.pp-milestones__group')).toBeNull();
    expect(root.querySelector('[data-pp-code]')).toBeNull();
    expect(root.querySelector('li a')).toBeNull();
    expect(root.querySelector('img')).toBeNull();
  });

  it('affiche telle quelle une date qui n’existe pas, sans datetime, et la laisse sans tri', async () => {
    const bad = [
      { id: 'a', label: 'A', status: 'planned', date: '2027-01' },
      { id: 'd', label: 'D', status: 'planned', date: '2026-02-30' },
    ];
    const root = await render({ milestones: bad });
    const time = root.querySelector('[data-pp-item="d"] time');
    expect(time?.textContent).toBe('2026-02-30');
    expect(time?.hasAttribute('datetime')).toBe(false);
    expect(items(root).map((li) => li.getAttribute('data-pp-item'))).toEqual(['a', 'd']);
  });

  it('ne rend aucun jalon pour une liste vide (la scène, elle, la refuse)', async () => {
    expect(items(await render({ milestones: [] }))).toHaveLength(0);
  });
});

describe('Milestones3D (balisage)', () => {
  it('réserve une scène masquée aux lecteurs d’écran, sans canvas', async () => {
    const root = await render();
    expect(root.querySelector('[data-pp-stage]')?.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('canvas')).toBeNull();
  });

  it('nomme la région avec label seulement quand il est donné', async () => {
    expect((await render({ label: 'Parcours' })).getAttribute('aria-label')).toBe('Parcours');
    expect((await render()).hasAttribute('aria-label')).toBe(false);
  });

  it('n’écrit aucun attribut style (CSP sans unsafe-inline)', async () => {
    const root = await render({ goal: GOAL, label: 'Parcours' });
    expect(root.querySelectorAll('[style]')).toHaveLength(0);
  });
});
