import { describe, expect, it, vi } from 'vitest';
import { MilestonesError } from '../src/error.ts';
import { FakeObserver } from './support.ts';
import { start, theme } from './instance-setup.ts';

describe('thème, jalon actif, sélection', () => {
  it('setTheme envoie le thème et demande une image', async () => {
    const { h, handle } = await start();
    h.runFrame();
    handle.setTheme(theme);
    expect(h.scene.calls).toContain('theme:30');
    expect(h.frames.size).toBe(1);
  });

  it('data-theme ou prefers-color-scheme : le thème est relu puis rappelé', async () => {
    const { h } = await start();
    // Ordre de création : ResizeObserver (0), MutationObserver (1), IntersectionObserver (2).
    expect(FakeObserver.all).toHaveLength(3);
    FakeObserver.all.at(1)?.fire([]);
    h.media.emit('change');
    expect(h.readThemes).toHaveLength(2);
    expect(h.scene.calls.filter((c) => c === 'theme:30')).toHaveLength(2);
  });

  it('jetons illisibles au changement : le thème en cours reste', async () => {
    const { h } = await start();
    h.env.readTheme = () => {
      throw new MilestonesError('invalid-theme');
    };
    expect(() => h.media.emit('change')).not.toThrow();
  });

  it('setActive relaie vers la scène ; un identifiant inconnu lève un code typé', async () => {
    const { h, handle } = await start();
    handle.setActive('b');
    expect(h.scene.calls).toContain('active:b');
    h.scene.failNext = 'active-index';
    expect(() => handle.setActive('zz')).toThrow(/active-index/);
  });

  it('un clic sur une médaille active le jalon et appelle onSelect', async () => {
    const onSelect = vi.fn();
    const { h } = await start({ onSelect });
    h.canvas.emit('pointerup', { clientX: 210, clientY: 120, pointerType: 'mouse' });
    expect(onSelect).toHaveBeenCalledWith('b');
    expect(h.scene.calls).toContain('active:b');
  });

  it('un clic dans le vide n’appelle pas onSelect', async () => {
    const onSelect = vi.fn();
    const { h } = await start({ onSelect });
    h.scene.pickResult = undefined;
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

  it('ignore un événement qui n’a pas de coordonnées', async () => {
    const { h } = await start();
    h.canvas.emit('pointermove', { type: 'pointermove' });
    h.canvas.emit('pointerup', null);
    expect(h.scene.calls.filter((c) => c.startsWith('move:'))).toHaveLength(0);
  });
});
