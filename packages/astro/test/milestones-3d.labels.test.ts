import { describe, expect, it } from 'vitest';
import { enhance } from '../src/behaviors/milestones-3d';
import { DomEvent, STEPS, fakeEnv, optionsOf, page, setup } from './milestones-3d-fixtures';
import { buttons } from './milestones-3d-queries';

describe('survol et étiquettes', () => {
  it('suit le survol : focus d’une étape vers la scène, médaille survolée vers l’étape', async () => {
    const host = page();
    const { deps, init, handle } = setup({}, fakeEnv(true));
    await enhance(host, deps);
    const item = host.querySelectorAll('[data-pp-item]')[1] as HTMLElement;
    buttons(host)[1]?.dispatchEvent(new DomEvent('focus'));
    expect(handle.calls.hover.at(-1)).toBe('beta');
    expect(item.hasAttribute('data-hover')).toBe(true);
    buttons(host)[1]?.dispatchEvent(new DomEvent('blur'));
    expect(handle.calls.hover.at(-1)).toBeNull();
    expect(item.hasAttribute('data-hover')).toBe(false);
    optionsOf(init)?.onHover('alpha');
    expect(host.querySelector('[data-pp-item="alpha"]')?.hasAttribute('data-hover')).toBe(true);
    optionsOf(init)?.onHover(null);
    expect(host.querySelector('[data-hover]')).toBeNull();
  });

  it('ajoute des étiquettes aria-hidden : code, date courte, titre, une par étape', async () => {
    const host = page();
    await enhance(host, setup({}, fakeEnv(true)).deps);
    const layer = host.querySelector('.pp-milestones__labels');
    expect(layer?.getAttribute('aria-hidden')).toBe('true');
    expect(layer?.querySelectorAll('.pp-milestones__label')).toHaveLength(STEPS.length);
    expect(layer?.querySelector('.pp-milestones__label-code')?.textContent).toBe('AAA-1');
  });

  it('pose chaque étiquette visible par le CSSOM (transform) d’après project()', async () => {
    const host = page();
    const stage = host.querySelector('[data-pp-stage]') as HTMLElement;
    Object.defineProperty(stage, 'clientWidth', { value: 1000 });
    Object.defineProperty(stage, 'clientHeight', { value: 500 });
    const { deps, env } = setup({}, fakeEnv(true));
    await enhance(host, deps);
    env.flush();
    const label = host.querySelector('.pp-milestones__label') as HTMLElement;
    expect(label.hasAttribute('data-hidden')).toBe(false);
    expect(label.style.transform).toMatch(/^translate\(/);
  });

  it('s’arrête quand rien ne bouge : aucune image planifiée au repos', async () => {
    const { deps, env } = setup({}, fakeEnv(true));
    await enhance(page(), deps);
    env.flush();
    expect(env.flush()).toBe(0);
  });
});
