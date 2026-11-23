// Initialisation du GPU de la scène par étapes (compilation et liaison des programmes, tampons) :
// chaque étape du `.wasm` est bornée, on rend la main au navigateur entre deux. Sous rastériseur
// logiciel, tout faire en un appel formait une tâche de plus de 50 ms (audit #394).
import { GPU_TIMEOUT_MS, GPU_WAIT_MS } from './constants.ts';
import { MilestonesError } from './error.ts';
import { phaseEnd, phaseStart } from './phases.ts';
import type { RawScene } from './raw.ts';
import { yieldToMain } from './yield.ts';

export const GPU_DONE = 0;
export const GPU_WAIT = 2;

const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Mène `gpuStep()` à son terme ; une compilation qui n'aboutit pas dans le délai lève `shader-compile` (repli `init-failed`). */
export async function initGpu(scene: RawScene, now: () => number = Date.now): Promise<void> {
  const deadline = now() + GPU_TIMEOUT_MS;
  for (let step = 1; ; step += 1) {
    let state = GPU_WAIT;
    while (state === GPU_WAIT) {
      if (now() > deadline) throw new MilestonesError('shader-compile', 'délai dépassé');
      const start = phaseStart();
      state = scene.gpuStep();
      if (state === GPU_WAIT) await pause(GPU_WAIT_MS);
      else phaseEnd(`gpu-step-${step}`, start);
    }
    if (state === GPU_DONE) return;
    await yieldToMain();
  }
}
