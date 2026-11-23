import { describe, expect, it } from 'vitest';
import { enhance } from '../src/behaviors/milestones-3d';
import { MILESTONES, fakeEnv, optionsOf, page, setup } from './milestones-3d-fixtures';
import { buttons, openDetails, panel } from './milestones-3d-queries';

describe('enhance (mode des étapes, mouvement réduit)', () => {
  it('ajoute un canvas aria-hidden hors tabulation et passe à l’état amélioré', async () => {
    const host = page();
    const { deps, init } = setup({}, fakeEnv(true));
    await enhance(host, deps);
    const canvas = host.querySelector('canvas');
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
    expect(canvas?.tabIndex).toBe(-1);
    expect(host.getAttribute('data-state')).toBe('enhanced');
    expect(host.getAttribute('data-mode')).toBe('steps');
    expect(optionsOf(init)?.activeId).toBe('alpha');
  });

  it('transmet le bloc de données à la scène, sans description', async () => {
    const { deps, init } = setup({}, fakeEnv(true));
    await enhance(page(), deps);
    expect(init.mock.calls[0]?.[1]).toEqual({ milestones: MILESTONES });
  });

  it('fait de la liste un repère d’étapes : un bouton par étape, objectif compris, aria-current', async () => {
    const host = page();
    await enhance(host, setup({}, fakeEnv(true)).deps);
    expect(buttons(host).map((b) => b.textContent)).toEqual(['Premier', 'Second', 'Objectif']);
    expect(buttons(host).map((b) => b.getAttribute('aria-current'))).toEqual(['step', null, null]);
    expect(host.querySelector('[data-pp-list]')?.getAttribute('aria-label')).toBe('Étapes');
    expect(host.querySelector('[data-pp-list]')?.hasAttribute('hidden')).toBe(false);
    expect(host.querySelectorAll('[data-pp-item]')).toHaveLength(3);
  });

  it('ajoute Précédent et Suivant et la position, sans région annoncée', async () => {
    const host = page();
    await enhance(host, setup({}, fakeEnv(true)).deps);
    const nav = host.querySelector('.pp-milestones__nav');
    expect(nav?.querySelectorAll('button')).toHaveLength(2);
    expect(nav?.textContent).toContain('Étape 1 sur 3');
    expect(host.querySelector('[aria-live]')).toBeNull();
  });

  it('affiche le détail de la première étape dans le panneau, sans saut de caméra animé', async () => {
    const host = page();
    const { deps, handle } = setup({}, fakeEnv(true));
    await enhance(host, deps);
    expect(panel(host).hasAttribute('hidden')).toBe(false);
    expect(panel(host).getAttribute('data-near')).toBe('true');
    expect(openDetails(host)).toEqual(['alpha']);
    expect(handle.calls.progress.at(-1)).toBe(0);
  });

  it('un clic sur une étape saute à son abscisse, sans défilement, et met le panneau à jour', async () => {
    const host = page();
    const { deps, handle, env } = setup({}, fakeEnv(true));
    await enhance(host, deps);
    buttons(host)[1]?.click();
    expect(handle.calls.progress.at(-1)).toBe(0.5);
    expect(handle.calls.active.at(-1)).toBe('beta');
    expect(openDetails(host)).toEqual(['beta']);
    expect(buttons(host)[1]?.getAttribute('aria-current')).toBe('step');
    expect(buttons(host)[0]?.hasAttribute('aria-current')).toBe(false);
    expect(env.scrolled).toEqual([]);
    expect(env.listeners).toBe(0);
    expect(host.querySelector('[data-pp-track]')?.getAttribute('style') ?? '').toBe('');
  });

  it('Précédent et Suivant parcourent les étapes sans boucler', async () => {
    const host = page();
    const { deps, handle } = setup({}, fakeEnv(true));
    await enhance(host, deps);
    const [previous, next] = Array.from(
      host.querySelectorAll<HTMLButtonElement>('.pp-milestones__nav button'),
    );
    previous?.click();
    expect(handle.calls.active.at(-1)).toBe('alpha');
    next?.click();
    next?.click();
    next?.click();
    expect(handle.calls.active.at(-1)).toBe('@goal');
    expect(host.querySelector('.pp-milestones__nav')?.textContent).toContain('Étape 3 sur 3');
    expect(next?.getAttribute('aria-disabled')).toBe('true');
  });

  it('un clic sur une médaille (onSelect) fait la même chose qu’un clic sur l’étape', async () => {
    const host = page();
    const { deps, init, handle } = setup({}, fakeEnv(true));
    await enhance(host, deps);
    optionsOf(init)?.onSelect('@goal');
    expect(handle.calls.progress.at(-1)).toBe(1);
    expect(openDetails(host)).toEqual(['@goal']);
  });
});
