import { describe, expect, it, vi } from 'vitest';
import { FakeObserver } from './support.ts';
import { start, theme } from './instance-setup.ts';

describe('thème', () => {
  it('setTheme envoie le thème (34 nombres) et demande une image', async () => {
    const { h, handle } = await start();
    h.runFrame();
    handle.setTheme(theme);
    expect(h.scene.calls).toContain('theme:34');
    expect(h.frames.size).toBe(1);
  });

  it('data-theme ou prefers-color-scheme : le thème est relu puis rappelé', async () => {
    const { h } = await start();
    // Ordre de création : ResizeObserver (0), MutationObserver (1), IntersectionObserver (2).
    expect(FakeObserver.all).toHaveLength(3);
    FakeObserver.all.at(1)?.fire([]);
    h.media.emit('change');
    expect(h.readThemes).toHaveLength(2);
    expect(h.scene.calls.filter((c) => c === 'theme:34')).toHaveLength(2);
  });

  it('jetons illisibles au changement : le thème en cours reste', async () => {
    const { h } = await start();
    h.env.readTheme = () => {
      throw new Error('illisible');
    };
    expect(() => h.media.emit('change')).not.toThrow();
  });
});

describe('pointeur : survol et sélection', () => {
  it('un clic sur une médaille appelle onSelect, sans déplacer l’étape active', async () => {
    const onSelect = vi.fn();
    const { h } = await start({ onSelect });
    h.canvas.emit('pointerup', { clientX: 210, clientY: 120, pointerType: 'mouse' });
    expect(onSelect).toHaveBeenCalledWith('b');
    expect(h.scene.calls.filter((c) => c.startsWith('active:'))).toEqual([]);
  });

  it('un clic dans le vide n’appelle pas onSelect', async () => {
    const onSelect = vi.fn();
    const { h } = await start({ onSelect });
    h.scene.pickResult = '';
    h.canvas.emit('pointerup', { clientX: 0, clientY: 0 });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('le pointeur est normalisé de -1 à 1, y vers le haut ; il quitte le canvas', async () => {
    const { h } = await start();
    h.canvas.emit('pointermove', { clientX: 410, clientY: 20 });
    h.canvas.emit('pointerleave');
    expect(h.scene.calls).toContain('move:1,1');
    expect(h.scene.calls).toContain('leave');
  });

  it('survol : pick rend l’étape, onHover n’est appelé qu’au changement, null à la sortie', async () => {
    const onHover = vi.fn();
    const { h } = await start({ onHover });
    h.canvas.emit('pointermove', { clientX: 210, clientY: 120 });
    h.canvas.emit('pointermove', { clientX: 211, clientY: 120 });
    expect(onHover.mock.calls).toEqual([['b']]);
    expect(h.scene.calls.filter((c) => c === 'hover:b')).toHaveLength(1);
    h.scene.pickResult = '';
    h.canvas.emit('pointermove', { clientX: 0, clientY: 0 });
    h.canvas.emit('pointerleave');
    expect(onHover.mock.calls).toEqual([['b'], [null]]);
    expect(h.scene.calls).toContain('hover:');
  });

  it('ignore un événement qui n’a pas de coordonnées', async () => {
    const { h } = await start();
    h.canvas.emit('pointermove', { type: 'pointermove' });
    h.canvas.emit('pointerup', null);
    expect(h.scene.calls.filter((c) => c.startsWith('move:'))).toHaveLength(0);
  });
});

describe('défilement jamais bloqué', () => {
  it('écouteurs du pointeur passifs, aucun écouteur wheel, touch ou scroll', async () => {
    const { h } = await start();
    const pointer = h.canvas.posed.filter((e) => e.type.startsWith('pointer'));
    expect(pointer.length).toBeGreaterThan(0);
    for (const { options } of pointer) expect(options).toEqual({ passive: true });
    const blocking = /^(wheel|mousewheel|touch\w*|scroll|gesture\w*)$/;
    for (const target of [h.canvas, h.window, h.document, h.media]) {
      expect(target.posed.filter((e) => blocking.test(e.type))).toEqual([]);
    }
  });
});
