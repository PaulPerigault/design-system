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

const flushed: string[] = [];
const flushSize = (): void => void flushed.push('flush');

describe('préchauffage', () => {
  it('attend, trace une image d’essai canvas caché, attend la clôture, puis montre le canvas', () => {
    const scene = new FakeScene();
    scene.warmWaits = 2;
    const canvas = new StyledCanvas();
    let clock = 10;
    const ready = createWarmup(scene, canvas, { time: () => clock, flushSize });
    expect(ready()).toBe(false); // image d'attente : canvas caché, aucun tracé
    expect(scene.calls).toEqual([]);
    expect(canvas.log).toEqual(['visibility:hidden']);
    expect(ready()).toBe(false); // image d'attente (redimensionnement du composant hôte)
    expect(scene.calls).toEqual([]);
    expect(ready()).toBe(false); // image d'essai
    expect(scene.calls).toEqual(['idle', 'warm:10']);
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
    const ready = createWarmup(scene, canvas, { time: () => clock, flushSize });
    ready();
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
    const ready = createWarmup(scene, canvas, { time: () => 0, flushSize });
    ready();
    ready();
    expect(ready()).toBe(true);
    expect(canvas.log.at(-1)).toBe('-visibility');
  });

  it('un canvas sans style (faux de test) se passe de masquage', () => {
    const scene = new FakeScene();
    const ready = createWarmup(scene, new FakeCanvas(), { time: () => 0, flushSize });
    ready();
    ready();
    ready();
    expect(ready()).toBe(true);
  });

  it('attend que le GPU ait rattrapé son retard, applique la taille, puis trace l’image d’essai', () => {
    flushed.length = 0;
    const scene = new FakeScene();
    scene.idleWaits = 2;
    const ready = createWarmup(scene, new StyledCanvas(), { time: () => 0, flushSize });
    ready();
    ready();
    expect(ready()).toBe(false);
    expect(ready()).toBe(false);
    expect(flushed).toEqual([]);
    expect(scene.calls.some((call) => call.startsWith('warm:'))).toBe(false);
    ready();
    expect(flushed).toEqual(['flush']);
    expect(scene.calls.some((call) => call.startsWith('warm:'))).toBe(true);
  });
});
