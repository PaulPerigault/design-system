import { describe, expect, it } from 'vitest';
import { enhance } from '../src/behaviors/milestones-3d';
import { MILESTONES, optionsOf, page, setup } from './milestones-3d-fixtures';

describe('enhance', () => {
  it('ajoute un canvas aria-hidden hors tabulation et passe à l’état amélioré', async () => {
    const host = page();
    const { deps, init } = setup();
    await enhance(host, deps);
    const canvas = host.querySelector('canvas');
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
    expect(canvas?.tabIndex).toBe(-1);
    expect(host.getAttribute('data-state')).toBe('enhanced');
    expect(optionsOf(init)?.activeId).toBe('alpha');
  });

  it('fait de chaque libellé un bouton et copie le premier jalon dans le panneau', async () => {
    const host = page();
    await enhance(host, setup().deps);
    const buttons = Array.from(host.querySelectorAll('button'));
    expect(buttons.map((b) => b.textContent)).toEqual(['Premier', 'Second']);
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
    const panel = host.querySelector('[data-pp-panel]');
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(panel?.textContent).toContain('Premier');
    expect(panel?.querySelector('button')).toBeNull();
    expect(panel?.querySelector('a')?.getAttribute('href')).toBe('/a/');
  });

  it('garde la liste complète : jamais retirée ni masquée', async () => {
    const host = page();
    await enhance(host, setup().deps);
    expect(host.querySelectorAll('[data-pp-item]')).toHaveLength(2);
    expect(host.querySelector('[data-pp-list]')?.hasAttribute('hidden')).toBe(false);
  });

  it('transmet les données du bloc JSON au paquet 3D', async () => {
    const { deps, init } = setup();
    await enhance(page(), deps);
    expect(init.mock.calls[0]?.[1]).toEqual({ milestones: MILESTONES });
  });

  it('relaie le sélecteur HTML vers setActive et met le panneau à jour', async () => {
    const host = page();
    const { deps, handle } = setup();
    await enhance(host, deps);
    host.querySelectorAll('button')[1]?.click();
    expect(handle.active).toEqual(['beta']);
    expect(host.querySelector('[data-pp-panel]')?.textContent).toContain('Second');
    expect(host.querySelectorAll('button')[0]?.getAttribute('aria-pressed')).toBe('false');
  });

  it('met le panneau à jour quand le canvas choisit un jalon, sans rappeler setActive', async () => {
    const host = page();
    const { deps, init, handle } = setup();
    await enhance(host, deps);
    optionsOf(init)?.onSelect('beta');
    expect(host.querySelector('[data-pp-panel]')?.textContent).toContain('Second');
    expect(host.querySelectorAll('button')[1]?.getAttribute('aria-pressed')).toBe('true');
    expect(handle.active).toEqual([]);
  });

  it('revient à la liste quand la scène se replie (perte de contexte), une seule fois', async () => {
    const host = page();
    const { deps, init, handle } = setup();
    await enhance(host, deps);
    optionsOf(init)?.onFallback('context-lost');
    optionsOf(init)?.onFallback('context-lost');
    expect(host.querySelector('canvas')).toBeNull();
    expect(host.querySelector('button')).toBeNull();
    expect(host.hasAttribute('data-state')).toBe(false);
    expect(host.querySelector('[data-pp-panel]')?.hasAttribute('hidden')).toBe(true);
    expect(host.querySelector('[data-pp-name]')?.textContent).toBe('Premier');
    expect(handle.destroyed).toBe(1);
  });
});
