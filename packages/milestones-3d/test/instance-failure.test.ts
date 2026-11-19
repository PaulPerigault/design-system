import { describe, expect, it } from 'vitest';
import { MilestonesError } from '../src/error.ts';
import { createInstance } from '../src/init.ts';
import type { FallbackReason } from '../src/types.ts';
import { createHarness } from './support.ts';
import type { Harness } from './support.ts';
import { data, theme } from './instance-setup.ts';

describe('échecs d’initialisation', () => {
  async function failing(patch: (h: Harness) => void, input: unknown = data) {
    const h = createHarness(theme);
    patch(h);
    const reasons: FallbackReason[] = [];
    const run = createInstance(h.canvas, input, theme, {
      options: { onFallback: (reason) => reasons.push(reason) },
      env: h.env,
    });
    const error = await run.then(
      () => undefined,
      (raised: unknown) => raised,
    );
    return { h, reasons, error };
  }

  it('.wasm non chargé : onFallback(load-failed) puis rejet typé', async () => {
    const { reasons, error, h } = await failing((x) => (x.loadError = new Error('404')));
    expect(reasons).toEqual(['load-failed']);
    expect(error).toBeInstanceOf(MilestonesError);
    expect(h.created).toHaveLength(0);
  });

  it('donnée invalide : onFallback(invalid-data), rien de chargé', async () => {
    const { reasons, error, h } = await failing(() => {}, { milestones: [] });
    expect(reasons).toEqual(['invalid-data']);
    expect(error).toMatchObject({ code: 'milestone-count' });
    expect(h.created).toHaveLength(0);
  });

  it('refus du .wasm (code littéral) : la raison en découle', async () => {
    const h = createHarness(theme);
    h.env.loadScene = async () => ({
      create: () => {
        throw new MilestonesError('gl-unavailable');
      },
    });
    const reasons: FallbackReason[] = [];
    await expect(
      createInstance(h.canvas, data, theme, {
        options: { onFallback: (r) => reasons.push(r) },
        env: h.env,
      }),
    ).rejects.toMatchObject({ code: 'gl-unavailable' });
    expect(reasons).toEqual(['no-webgl2']);
  });

  it('échec après la création de la scène : repli et destroy complet', async () => {
    class Broken {
      constructor() {
        throw new Error('pas de ResizeObserver');
      }
      observe() {}
      disconnect() {}
    }
    const h = createHarness(theme, { ResizeObserver: Broken });
    const reasons: FallbackReason[] = [];
    await expect(
      createInstance(h.canvas, data, theme, {
        options: { onFallback: (r) => reasons.push(r) },
        env: h.env,
      }),
    ).rejects.toBeInstanceOf(MilestonesError);
    expect(reasons).toEqual(['init-failed']);
    expect(h.scene.calls.slice(-2)).toEqual(['destroy', 'free']);
    expect(h.canvas.live).toBe(0);
  });
});
