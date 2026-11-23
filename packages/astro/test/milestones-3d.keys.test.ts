import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { enhance } from '../src/behaviors/milestones-3d';
import { stepFor } from '../src/behaviors/milestones-3d-keys';
import { DomEvent, fakeEnv, page, setup } from './milestones-3d-fixtures';

function press(host: Element, key: string, extra: Record<string, boolean> = {}): Event {
  const event = new DomEvent('keydown', { bubbles: true, cancelable: true });
  Object.assign(
    event,
    { key, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false },
    extra,
  );
  host.querySelector('button')?.dispatchEvent(event);
  return event as Event;
}

describe('clavier', () => {
  const start = async () => {
    const host = page();
    const ctx = setup({}, fakeEnv(true));
    await enhance(host, ctx.deps);
    return { host, ...ctx };
  };

  it('Flèche droite et gauche avancent et reculent d’une étape', async () => {
    const { host, handle } = await start();
    expect(press(host, 'ArrowRight').defaultPrevented).toBe(true);
    expect(handle.calls.active.at(-1)).toBe('beta');
    press(host, 'ArrowLeft');
    expect(handle.calls.active.at(-1)).toBe('alpha');
  });

  it('Fin et Début vont à la dernière et à la première étape', async () => {
    const { host, handle } = await start();
    press(host, 'End');
    expect(handle.calls.active.at(-1)).toBe('@goal');
    press(host, 'Home');
    expect(handle.calls.active.at(-1)).toBe('alpha');
  });

  it('ne touche ni à Tab, ni aux flèches haut et bas, ni aux combinaisons', async () => {
    const { host, handle } = await start();
    const before = handle.calls.active.length;
    for (const key of ['Tab', 'ArrowUp', 'ArrowDown', ' ', 'PageDown', 'Enter', 'Escape']) {
      expect(press(host, key).defaultPrevented, key).toBe(false);
    }
    expect(press(host, 'ArrowRight', { altKey: true }).defaultPrevented).toBe(false);
    expect(press(host, 'ArrowRight', { shiftKey: true }).defaultPrevented).toBe(false);
    expect(handle.calls.active.length).toBe(before);
  });

  it('inverse les flèches en écriture de droite à gauche', () => {
    expect(stepFor('ArrowRight', false)).toBe(1);
    expect(stepFor('ArrowRight', true)).toBe(-1);
    expect(stepFor('Tab', false)).toBeNull();
  });
});

describe('aucun détournement du défilement (code source du comportement)', () => {
  const dir = new URL('../src/behaviors/', import.meta.url);
  const sources = readdirSync(dir)
    .filter((name) => name.startsWith('milestones-3d'))
    .map((name) => [name, readFileSync(new URL(name, dir), 'utf8')] as const);

  it('aucun écouteur wheel, touch ou scroll non passif, aucun scroll-snap', () => {
    for (const [name, source] of sources) {
      expect(source, name).not.toMatch(
        /['"](?:wheel|touchstart|touchmove|touchend|mousewheel)['"]/,
      );
      expect(source, name).not.toMatch(/scroll-snap|scrollSnap/);
    }
    const env = sources.find(([name]) => name === 'milestones-3d-env.ts')?.[1] ?? '';
    expect(env).toMatch(/'scroll', callback, \{ passive: true \}/);
  });

  it('preventDefault seulement pour les touches gérées (flèches gauche, droite, Début, Fin)', () => {
    const using = sources.filter(([, source]) => source.includes('preventDefault()'));
    expect(using.map(([name]) => name)).toEqual(['milestones-3d-keys.ts']);
  });
});
