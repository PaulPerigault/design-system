import { describe, expect, it, vi } from 'vitest';
import { createBag } from '../src/bag.ts';
import { createLoop } from '../src/loop.ts';
import { FakeTarget } from './support.ts';

function setup(draw = vi.fn(() => false)) {
  const frames = new Map<number, (time: number) => void>();
  let next = 0;
  const cancelled: number[] = [];
  const loop = createLoop(draw, {
    requestFrame: (callback) => {
      next += 1;
      frames.set(next, callback);
      return next;
    },
    cancelFrame: (id) => {
      cancelled.push(id);
      frames.delete(id);
    },
  });
  const flush = (time = 16): void => {
    const [id, callback] = [...frames][0] ?? [];
    if (id === undefined || !callback) return;
    frames.delete(id);
    callback(time);
  };
  return { loop, frames, flush, draw, cancelled };
}

describe('rendu à la demande', () => {
  it('aucune image au repos', () => {
    const { frames } = setup();
    expect(frames.size).toBe(0);
  });

  it('plusieurs demandes rapprochées ne planifient qu’une image', () => {
    const { loop, frames } = setup();
    loop.request();
    loop.request();
    loop.request();
    expect(frames.size).toBe(1);
    expect(loop.scheduled).toBe(true);
  });

  it('redemande tant que draw rend vrai, puis s’arrête', () => {
    const draw = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValue(false);
    const { loop, frames, flush } = setup(draw);
    loop.request();
    flush();
    flush();
    flush();
    expect(draw).toHaveBeenCalledTimes(3);
    expect(frames.size).toBe(0);
    expect(loop.scheduled).toBe(false);
  });

  it('transmet l’horodatage à draw', () => {
    const { loop, flush, draw } = setup();
    loop.request();
    flush(123);
    expect(draw).toHaveBeenCalledWith(123);
  });
});

describe('pause et arrêt', () => {
  it('en pause : rien n’est planifié, l’image en attente est annulée', () => {
    const { loop, frames, cancelled } = setup();
    loop.request();
    loop.setPaused(true);
    expect(cancelled).toEqual([1]);
    loop.request();
    expect(frames.size).toBe(0);
  });

  it('à la reprise : une image est demandée', () => {
    const { loop, frames } = setup();
    loop.setPaused(true);
    loop.setPaused(false);
    expect(frames.size).toBe(1);
  });

  it('une image déjà partie quand la pause arrive ne dessine rien', () => {
    const { loop, draw, frames } = setup();
    loop.request();
    const callback = [...frames.values()][0];
    loop.setPaused(true);
    callback?.(16);
    expect(draw).not.toHaveBeenCalled();
  });

  it('stop annule l’image et interdit toute nouvelle demande, reprise comprise', () => {
    const { loop, frames } = setup();
    loop.request();
    loop.stop();
    loop.request();
    loop.setPaused(false);
    expect(frames.size).toBe(0);
  });
});

describe('registre de nettoyages', () => {
  it('retire écouteurs et nettoyages, dans l’ordre inverse, une seule fois', () => {
    const bag = createBag();
    const target = new FakeTarget();
    const order: string[] = [];
    bag.listen(target, 'x', () => {});
    bag.add(() => order.push('premier'));
    bag.add(() => order.push('second'));
    expect(bag.size).toBe(3);
    bag.disposeAll();
    bag.disposeAll();
    expect(order).toEqual(['second', 'premier']);
    expect(target.live).toBe(0);
    expect(bag.size).toBe(0);
  });
});
