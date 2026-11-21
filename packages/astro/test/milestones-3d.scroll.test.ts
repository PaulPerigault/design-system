import { describe, expect, it } from 'vitest';
import { enhance } from '../src/behaviors/milestones-3d';
import { fakeEnv, page, placeTrack, setup } from './milestones-3d-fixtures';

const VIEWPORT = 800;
/** (3 étapes x 70 % + 100 %) de la hauteur d'écran. */
const HEIGHT = 2480;
const RANGE = HEIGHT - VIEWPORT;

async function scrolling(top = 0) {
  const host = page();
  const env = fakeEnv(false, VIEWPORT);
  placeTrack(host, env, HEIGHT, top);
  const setupped = setup({}, env);
  await enhance(host, setupped.deps);
  env.flush();
  const steps = Array.from(host.querySelectorAll<HTMLButtonElement>('.pp-milestones__select'));
  return { ...setupped, host, steps };
}
const detail = (host: Element): string | null =>
  host.querySelector('[data-pp-detail]:not([hidden])')?.getAttribute('data-pp-detail') ?? null;

describe('enhance (mode piloté au défilement)', () => {
  it('pose la hauteur de la piste par le CSSOM et un écouteur de défilement passif', async () => {
    const { host, env } = await scrolling();
    const track = host.querySelector('[data-pp-track]') as HTMLElement;
    expect(host.getAttribute('data-mode')).toBe('scroll');
    expect(track.style.getPropertyValue('--milestones-steps')).toBe('3');
    expect(host.getAttribute('style')).toBeNull();
    expect(env.listeners).toBe(1);
  });

  it('suit le défilement : progression, étape la plus proche, panneau au voisinage', async () => {
    const { host, env, handle, steps } = await scrolling();
    env.setScroll(RANGE * 0.5);
    env.flush();
    expect(handle.calls.progress.at(-1)).toBeCloseTo(0.5);
    expect(handle.calls.active.at(-1)).toBe('beta');
    expect(steps[1]?.getAttribute('aria-current')).toBe('step');
    expect(detail(host)).toBe('beta');
    expect(host.querySelector('[data-pp-panel]')?.getAttribute('data-near')).toBe('true');
    env.setScroll(RANGE * 0.7);
    env.flush();
    expect(host.querySelector('[data-pp-panel]')?.getAttribute('data-near')).toBe('false');
  });

  it('revient en arrière : la même position donne la même étape', async () => {
    const { host, env, handle } = await scrolling();
    env.setScroll(RANGE);
    env.flush();
    expect(handle.calls.active.at(-1)).toBe('@goal');
    env.setScroll(0);
    env.flush();
    expect(handle.calls.active.at(-1)).toBe('alpha');
    expect(detail(host)).toBe('alpha');
    expect(handle.calls.progress.at(-1)).toBe(0);
  });

  it('un clic sur une étape défile vers sa position, en douceur, sans sauter lui-même', async () => {
    const { env, steps, handle } = await scrolling(1000);
    const before = handle.calls.progress.length;
    steps[2]?.click();
    expect(env.scrolled).toEqual([{ top: 1000 + RANGE, smooth: true }]);
    expect(handle.calls.progress.length).toBe(before);
  });

  it('met à jour directement quand le défilement est déjà au bon endroit', async () => {
    const { env, steps, handle, host } = await scrolling(0);
    env.setScroll(RANGE * 0.5);
    env.flush();
    steps[0]?.click();
    expect(env.scrolled).toEqual([{ top: 0, smooth: true }]);
    env.setScroll(0);
    env.flush();
    steps[0]?.click();
    expect(env.scrolled).toHaveLength(1);
    expect(handle.calls.progress.at(-1)).toBe(0);
    expect(detail(host)).toBe('alpha');
  });

  it('le mouvement réduit demandé en cours de route bascule en étapes, et inversement', async () => {
    const { host, env } = await scrolling();
    const track = host.querySelector('[data-pp-track]') as HTMLElement;
    env.setReduced(true);
    expect(host.getAttribute('data-mode')).toBe('steps');
    expect(track.style.getPropertyValue('--milestones-steps')).toBe('');
    expect(env.listeners).toBe(0);
    env.setReduced(false);
    expect(host.getAttribute('data-mode')).toBe('scroll');
    expect(env.listeners).toBe(1);
  });
});
