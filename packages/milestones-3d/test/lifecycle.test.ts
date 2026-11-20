import { describe, expect, it } from 'vitest';
import { createInstance } from '../src/init.ts';
import type { Theme } from '../src/types.ts';
import { FakeObserver, createHarness } from './support.ts';

const theme: Theme = {
  colors: {
    bg: { space: 'srgb', r: 1, g: 1, b: 1 },
    fg: { space: 'srgb', r: 0, g: 0, b: 0 },
    accent: { space: 'srgb', r: 0, g: 0, b: 1 },
    onAccent: { space: 'srgb', r: 1, g: 1, b: 1 },
    line: { space: 'srgb', r: 0.8, g: 0.8, b: 0.8 },
    muted: { space: 'srgb', r: 0.5, g: 0.5, b: 0.5 },
  },
  durationBase: 160,
  durationFast: 100,
  easing: [0, 0, 1, 1],
};
const data = { milestones: [{ id: 'a', label: 'A', status: 'planned' }] };

async function running() {
  const h = createHarness(theme);
  const handle = await createInstance(h.canvas, data, theme, { options: {}, env: h.env });
  return { h, handle };
}

describe('destroy() libère tout', () => {
  it('retire tous les écouteurs : posés et retirés en nombre égal, aucun vivant', async () => {
    const { h, handle } = await running();
    const targets = [h.canvas, h.window, h.document, h.media];
    expect(targets.reduce((sum, t) => sum + t.live, 0)).toBeGreaterThan(0);
    handle.destroy();
    for (const target of targets) {
      expect(target.live).toBe(0);
      expect(target.removes).toBe(target.adds);
    }
  });

  it('déconnecte les trois observateurs', async () => {
    const { handle } = await running();
    expect(FakeObserver.all).toHaveLength(3);
    handle.destroy();
    for (const observer of FakeObserver.all) expect(observer.disconnected).toBe(1);
  });

  it('arrête le rendu : image planifiée annulée, aucune nouvelle', async () => {
    const { h, handle } = await running();
    expect(h.frames.size).toBe(1);
    handle.destroy();
    expect(h.frames.size).toBe(0);
    h.document.emit('visibilitychange');
    expect(h.frames.size).toBe(0);
  });

  it('annule le minuteur de restauration en attente', async () => {
    const { h, handle } = await running();
    h.canvas.emit('webglcontextlost', { preventDefault() {} });
    expect(h.timers.size).toBe(1);
    handle.destroy();
    expect(h.timers.size).toBe(0);
  });

  it('libère les ressources GL puis la scène, une seule fois', async () => {
    const { h, handle } = await running();
    handle.destroy();
    handle.destroy();
    expect(h.scene.calls.filter((c) => c === 'destroy')).toHaveLength(1);
    expect(h.scene.calls.slice(-2)).toEqual(['destroy', 'free']);
  });

  it('libère la scène même si destroy() de la scène lève', async () => {
    const { h, handle } = await running();
    h.scene.destroy = () => {
      throw new Error('contexte déjà perdu');
    };
    expect(() => handle.destroy()).toThrow(/contexte/);
    expect(h.scene.calls).toContain('free');
  });

  it('après destroy(), setTheme et setActive ne font rien', async () => {
    const { h, handle } = await running();
    handle.destroy();
    const before = h.scene.calls.length;
    handle.setTheme(theme);
    handle.setActive('a');
    expect(h.scene.calls).toHaveLength(before);
    expect(h.frames.size).toBe(0);
  });

  it('un clic ou un changement de thème après destroy() n’a plus d’effet', async () => {
    const { h, handle } = await running();
    handle.destroy();
    const before = h.scene.calls.length;
    h.canvas.emit('pointermove', { clientX: 1, clientY: 1 });
    h.media.emit('change');
    expect(h.scene.calls).toHaveLength(before);
  });
});
