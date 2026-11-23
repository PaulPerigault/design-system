import { describe, expect, it } from 'vitest';
import { WARM_TIMEOUT_MS } from '../src/constants.ts';
import { createWarmup } from '../src/warmup.ts';
import { FakeCanvas } from './support-dom.ts';
import { FakeScene } from './support-scene.ts';

class StyledCanvas extends FakeCanvas {
  readonly log: string[] = [];
  readonly style = {
    setProperty: (name: string, value: string): void => void this.log.push(`${name}:${value}`),
    removeProperty: (name: string): string => (this.log.push(`-${name}`), ''),
  };
}

describe('préchauffage', () => {
  it('attend, trace une image d’essai canvas caché, attend la clôture, puis montre le canvas', () => {
    const scene = new FakeScene();
    scene.warmWaits = 2;
    const canvas = new StyledCanvas();
    let clock = 10;
    const ready = createWarmup(scene, canvas, () => clock);
    expect(ready()).toBe(false); // image d'attente : canvas caché, aucun tracé
    expect(scene.calls).toEqual([]);
    expect(canvas.log).toEqual(['visibility:hidden']);
    expect(ready()).toBe(false); // image d'essai
    expect(scene.calls).toEqual(['warm:10']);
    expect(ready()).toBe(false);
    expect(ready()).toBe(false);
    expect(ready()).toBe(true); // clôture atteinte : canvas montré
    expect(canvas.log).toEqual(['visibility:hidden', '-visibility']);
    clock += 1;
  });

  it('un GPU qui ne répond pas dans le délai n’empêche pas d’afficher', () => {
    const scene = new FakeScene();
    scene.warmWaits = Number.MAX_SAFE_INTEGER;
    const canvas = new StyledCanvas();
    let clock = 0;
    const ready = createWarmup(scene, canvas, () => clock);
    ready();
    ready();
    clock = WARM_TIMEOUT_MS + 1;
    expect(ready()).toBe(true);
    expect(canvas.log.at(-1)).toBe('-visibility');
  });

  it('un tracé d’essai refusé montre aussitôt le canvas', () => {
    const scene = new FakeScene();
    scene.warmFrame = () => {
      throw new Error('gl');
    };
    const canvas = new StyledCanvas();
    const ready = createWarmup(scene, canvas, () => 0);
    ready();
    expect(ready()).toBe(true);
    expect(canvas.log.at(-1)).toBe('-visibility');
  });

  it('un canvas sans style (faux de test) se passe de masquage', () => {
    const scene = new FakeScene();
    const ready = createWarmup(scene, new FakeCanvas(), () => 0);
    ready();
    ready();
    expect(ready()).toBe(true);
  });
});
