import { describe, expect, it } from 'vitest';
import { GOAL, items, render } from './Milestones3D.fixtures';

describe('Milestones3D (rendu classique, sans JavaScript)', () => {
  it('rend une liste ordonnée avec role="list" et un li par jalon, dans l’ordre', async () => {
    const root = await render();
    expect(root.querySelector('ol')?.getAttribute('role')).toBe('list');
    expect(items(root).map((li) => li.getAttribute('data-pp-item'))).toEqual(['alpha', 'beta']);
  });

  it('écrit le statut en toutes lettres, jamais par la seule forme', async () => {
    const statuses = items(await render()).map(
      (li) => li.querySelector('.pp-milestones__status')?.textContent,
    );
    expect(statuses).toEqual(['Atteint', 'Prévu']);
  });

  it('formate les dates avec Intl dans la langue demandée, avec datetime machine', async () => {
    const [first, second] = items(await render());
    expect(first?.querySelector('time')?.textContent).toBe('mars 2025');
    expect(first?.querySelector('time')?.getAttribute('datetime')).toBe('2025-03');
    expect(second?.querySelector('time')?.textContent).toBe('30 novembre 2026');
  });

  it('formate les dates dans une autre langue quand locale est donné', async () => {
    const [first] = items(await render({ locale: 'en' }));
    expect(first?.querySelector('time')?.textContent).toBe('March 2025');
  });

  it('nomme chaque lien avec le libellé du jalon et pose le href tel quel', async () => {
    const link = (await render()).querySelector('li a');
    expect(link?.getAttribute('href')).toBe('/beta/');
    expect(link?.getAttribute('aria-label')).toBe('Voir : Second jalon');
  });

  it('accepte des textes d’interface traduits', async () => {
    const root = await render({ labels: { achieved: 'Done', planned: 'Planned', open: 'Open' } });
    expect(
      items(root)
        .map((li) => li.textContent)
        .join(' '),
    ).toContain('Done');
    expect(root.querySelector('li a')?.getAttribute('aria-label')).toBe('Open : Second jalon');
  });

  it('rend la cible finale avec son lien, et rien sans cible', async () => {
    const goal = (await render({ goal: GOAL })).querySelector('[data-pp-goal]');
    expect(goal?.textContent).toContain('Cible');
    expect(goal?.querySelector('a')?.getAttribute('href')).toBe('https://example.org/cible');
    expect((await render()).querySelector('[data-pp-goal]')).toBeNull();
    const plain = (await render({ goal: { label: 'Sans lien' } })).querySelector('[data-pp-goal]');
    expect(plain?.querySelector('a')).toBeNull();
  });

  it('réserve un emplacement de scène masqué aux lecteurs d’écran, sans canvas', async () => {
    const root = await render();
    expect(root.querySelector('[data-pp-stage]')?.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('canvas')).toBeNull();
  });

  it('rend un panneau de détail vide et masqué, annoncé poliment', async () => {
    const panel = (await render()).querySelector('[data-pp-panel]');
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(panel?.getAttribute('aria-live')).toBe('polite');
    expect(panel?.getAttribute('aria-label')).toBe('Détail du jalon');
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
