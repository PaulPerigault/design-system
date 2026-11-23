import { describe, expect, it } from 'vitest';
import { GPU_TIMEOUT_MS } from '../src/constants.ts';
import { initGpu } from '../src/gpu-steps.ts';
import { FakeScene } from './support-scene.ts';

describe('initGpu', () => {
  it('appelle gpuStep jusqu’à la fin, une étape après l’autre', async () => {
    const scene = new FakeScene();
    scene.stepsLeft = 3;
    await initGpu(scene);
    expect(scene.calls.filter((c) => c === 'gpu-step')).toHaveLength(4);
  });

  it('attend une compilation en cours puis continue', async () => {
    const scene = new FakeScene();
    scene.stepsLeft = 1;
    scene.waitsLeft = 2;
    await initGpu(scene);
    expect(scene.calls.filter((c) => c === 'gpu-step')).toHaveLength(4);
  });

  it('une compilation qui n’aboutit pas dans le délai lève init-failed', async () => {
    const scene = new FakeScene();
    scene.waitsLeft = Number.MAX_SAFE_INTEGER;
    let clock = 0;
    const now = (): number => (clock += GPU_TIMEOUT_MS / 3);
    await expect(initGpu(scene, now)).rejects.toMatchObject({ code: 'init-failed' });
  });
});
