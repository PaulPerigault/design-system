import { describe, expect, it, vi } from 'vitest';
import { enhance, type Deps } from '../src/behaviors/milestones-3d';
import { fakeEnv, optionsOf, page, setup } from './milestones-3d-fixtures';

describe('enhance (repli sur la liste)', () => {
  it('revient à la liste quand init échoue', async () => {
    const host = page();
    const { deps } = setup({ init: () => Promise.reject(new Error('shader')) });
    await expect(enhance(host, deps)).resolves.toBeUndefined();
    expect(host.querySelector('canvas')).toBeNull();
    expect(host.hasAttribute('data-state')).toBe(false);
  });

  it('ne fait rien quand le paquet 3D ne se charge pas (absent, CSP, hors ligne)', async () => {
    const host = page();
    const deps: Deps = { ...setup().deps, load: () => Promise.reject(new Error('404')) };
    await expect(enhance(host, deps)).resolves.toBeUndefined();
    expect(host.querySelector('canvas')).toBeNull();
    expect(host.querySelector('button')).toBeNull();
  });

  it('ne crée aucun canvas quand le paquet refuse (WebGL2 absent, appareil faible)', async () => {
    const host = page();
    const { deps, init } = setup({ canEnhance: () => false });
    await enhance(host, deps);
    expect(init).not.toHaveBeenCalled();
    expect(host.querySelector('canvas')).toBeNull();
  });

  it('ne charge rien en économie de données', async () => {
    const load = vi.fn();
    const ready = vi.fn();
    await enhance(page(), { load, ready, early: () => 'save-data' } as unknown as Deps);
    expect(load).not.toHaveBeenCalled();
    expect(ready).not.toHaveBeenCalled();
  });

  it('ignore un bloc de données illisible et un second appel sur le même composant', async () => {
    const broken = page();
    broken.querySelector('[data-pp-data]')?.replaceChildren('{pas du json');
    const { deps, init } = setup();
    await enhance(broken, deps);
    expect(init).not.toHaveBeenCalled();
    const twice = page();
    await enhance(twice, deps);
    await enhance(twice, deps);
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('ne bloque plus le mouvement réduit : la scène démarre, en mode des étapes', async () => {
    const host = page();
    const { deps, init } = setup({}, fakeEnv(true));
    await enhance(host, deps);
    expect(init).toHaveBeenCalledTimes(1);
    expect(host.getAttribute('data-mode')).toBe('steps');
  });

  it('revient à la liste quand la scène se replie (perte de contexte), une seule fois', async () => {
    const host = page();
    const { deps, init, handle, env } = setup({}, fakeEnv());
    await enhance(host, deps);
    expect(env.listeners).toBe(1);
    optionsOf(init)?.onFallback('context-lost');
    optionsOf(init)?.onFallback('context-lost');
    expect(host.querySelector('canvas')).toBeNull();
    expect(host.querySelector('button')).toBeNull();
    expect(host.querySelector('.pp-milestones__labels')).toBeNull();
    expect(host.querySelector('.pp-milestones__nav')).toBeNull();
    expect(['data-state', 'data-mode'].some((name) => host.hasAttribute(name))).toBe(false);
    expect(host.querySelector('[data-pp-panel]')?.hasAttribute('hidden')).toBe(true);
    expect(host.querySelector('[data-pp-detail]:not([hidden])')).toBeNull();
    expect(host.querySelector('[data-pp-name]')?.textContent).toBe('Premier');
    expect(host.querySelector('a')?.hasAttribute('tabindex')).toBe(false);
    expect(handle.calls.destroyed).toBe(1);
    expect(env.listeners).toBe(0);
    expect(env.flush()).toBe(0);
  });

  it('revient à la liste, sans message, quand l’init échoue après le canvas (WebGL perdu)', async () => {
    const host = page();
    const { deps } = setup({ init: () => Promise.reject(new Error('gl')) });
    await enhance(host, deps);
    expect(host.querySelector('canvas')).toBeNull();
    expect(host.textContent).not.toMatch(/webgl|erreur/i);
  });
});
