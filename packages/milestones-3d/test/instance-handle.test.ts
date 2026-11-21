import { describe, expect, it } from 'vitest';
import { start } from './instance-setup.ts';

describe('poignée : chaque commande planifie une image', () => {
  it('setProgress, setHover, setActive, setTheme : relais puis une image, jamais plus', async () => {
    const { h, handle } = await start();
    h.runFrame();
    expect(h.frames.size).toBe(0);
    handle.setProgress(0.5);
    expect(h.frames.size).toBe(1);
    h.runFrame();
    handle.setHover('a');
    expect(h.frames.size).toBe(1);
    h.runFrame();
    handle.setActive('b');
    expect(h.frames.size).toBe(1);
    h.runFrame();
    expect(h.scene.calls).toEqual(expect.arrayContaining(['progress:0.5', 'hover:a', 'active:b']));
    expect(h.runFrame()).toBe(false);
  });

  it('une commande n’agit qu’à la prochaine image, avec l’horloge de frame', async () => {
    const { h, handle } = await start();
    h.runFrame();
    const before = h.scene.calls.filter((c) => c.startsWith('frame:')).length;
    handle.setProgress(1);
    expect(h.scene.calls.filter((c) => c.startsWith('frame:'))).toHaveLength(before);
    h.clock += 250;
    h.runFrame();
    expect(h.scene.calls.at(-1)).toBe('frame:250');
  });

  it('aucune boucle au repos : sans commande, aucune image planifiée', async () => {
    const { h } = await start();
    h.runFrame();
    h.clock += 10_000;
    expect(h.frames.size).toBe(0);
    expect(h.timers.size).toBe(0);
  });

  it('setHover(null) efface le survol', async () => {
    const { h, handle } = await start();
    handle.setHover(null);
    expect(h.scene.calls).toContain('hover:');
  });
});

describe('poignée : erreurs typées et lectures', () => {
  it('setActive : identifiant inconnu lève unknown-id, chaîne vide efface', async () => {
    const { h, handle } = await start();
    expect(() => handle.setActive('zz')).toThrow(/unknown-id.*zz/);
    expect(() => handle.setActive('')).not.toThrow();
    expect(h.scene.calls).toContain('active:');
  });

  it('setProgress non fini : code progress de la scène', async () => {
    const { handle } = await start();
    expect(() => handle.setProgress(Number.NaN)).toThrow(/progress/);
  });

  it('progressOf rend -1 pour un identifiant inconnu', async () => {
    const { handle } = await start();
    expect(handle.progressOf('a')).toBe(0.5);
    expect(handle.progressOf('@goal')).toBe(0.5);
    expect(handle.progressOf('zz')).toBe(-1);
  });

  it('project rend les étapes dans l’ordre, jalons puis objectif', async () => {
    const { handle } = await start();
    const marks = handle.project();
    expect(marks.map((m) => m.id)).toEqual(['a', 'b', '@goal']);
    expect(marks[0]).toEqual({
      id: 'a',
      x: 0.25,
      y: 0.5,
      scale: expect.closeTo(0.1),
      visible: true,
    });
    expect(marks[1]?.visible).toBe(false);
    expect(marks[2]).toEqual({ id: '@goal', x: 0, y: 0, scale: 0, visible: false });
  });

  it('après destroy : commandes sans effet, lectures neutres', async () => {
    const { h, handle } = await start();
    handle.destroy();
    const before = h.scene.calls.length;
    handle.setProgress(1);
    handle.setHover('a');
    handle.setActive('a');
    expect(handle.progressOf('a')).toBe(-1);
    expect(handle.project()).toEqual([]);
    expect(h.scene.calls).toHaveLength(before);
    expect(h.frames.size).toBe(0);
  });
});
