import { describe, expect, it, vi } from 'vitest';
import { enhance, type Deps } from '../src/behaviors/milestones-3d';
import { page, setup } from './milestones-3d-fixtures';

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

  it('ne charge rien quand le mouvement est réduit ou les données économisées', async () => {
    const load = vi.fn();
    const ready = vi.fn();
    await enhance(page(), { load, ready, early: () => 'reduced-motion' } as unknown as Deps);
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
});
