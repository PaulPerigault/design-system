import { describe, expect, it } from 'vitest';
import { enhance } from '../src/behaviors/milestones-3d';
import { fakeEnv, page, setup } from './milestones-3d-fixtures';

/** Un jalon obtenu avec l'image de badge du rendu serveur, comme `MilestoneBadge.astro`. */
function withBadge(): HTMLElement {
  const host = page();
  const item = host.querySelector('[data-pp-item="alpha"]');
  item?.insertAdjacentHTML('afterbegin', '<img class="pp-milestones__badge" src="/b/a.webp">');
  const stage = host.querySelector('[data-pp-stage]') as HTMLElement;
  Object.defineProperty(stage, 'clientWidth', { value: 1000 });
  Object.defineProperty(stage, 'clientHeight', { value: 500 });
  return host;
}

describe('badges de la scène', () => {
  it('crée une image aria-hidden, sans texte alternatif ni tabulation, pour un jalon obtenu', async () => {
    const host = withBadge();
    await enhance(host, setup({}, fakeEnv(true)).deps);
    const sprites = host.querySelectorAll<HTMLImageElement>('.pp-milestones__sprite');
    expect(sprites).toHaveLength(1);
    const [image] = sprites;
    expect(image?.getAttribute('aria-hidden')).toBe('true');
    expect(image?.getAttribute('alt')).toBe('');
    expect(image?.getAttribute('tabindex')).toBe('-1');
    expect(host.querySelector('.pp-milestones__sprites')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('ne charge l’image qu’à la première visibilité et la pose sans rotation', async () => {
    const host = withBadge();
    const { deps, env, handle } = setup({}, fakeEnv(false));
    handle.marks.forEach((mark) => void Object.assign(mark, { visible: false }));
    await enhance(host, deps);
    env.flush();
    const image = host.querySelector('.pp-milestones__sprite') as HTMLImageElement;
    expect(image.getAttribute('src')).toBeNull();
    handle.marks.forEach((mark) => void Object.assign(mark, { visible: true }));
    Object.defineProperty(image, 'naturalWidth', { value: 400 });
    Object.defineProperty(image, 'naturalHeight', { value: 300 });
    env.setScroll(1);
    env.flush();
    expect(image.getAttribute('src')).toBe('/b/a.webp');
    expect(image.hasAttribute('data-hidden')).toBe(false);
    expect(image.style.transform).toMatch(/^translate\(.*\) scale\([^,)]+\)$/);
  });

  it('retire la couche au retour à la liste', async () => {
    const host = withBadge();
    const { deps, init } = setup({}, fakeEnv(true));
    await enhance(host, deps);
    init.mock.calls[0]?.[3].onFallback('init-failed');
    expect(host.querySelector('.pp-milestones__sprites')).toBeNull();
  });
});
