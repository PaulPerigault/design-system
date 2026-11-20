import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { WEBGL_ATTRIBUTES } from '../src/constants.ts';
import { data, start, theme } from './instance-setup.ts';
import { createInstance } from '../src/init.ts';
import { createHarness } from './support.ts';
import { yieldToMain } from '../src/yield.ts';

const RUST = readFileSync(
  new URL('../../../crates/pp-milestones-wasm/src/gl.rs', import.meta.url),
  'utf8',
);

describe('attributs du contexte WebGL2 créé d’avance', () => {
  it('reprennent ceux du crate Rust, un à un', () => {
    const expected: Record<string, string> = {
      alpha: 'set_alpha(true)',
      depth: 'set_depth(true)',
      antialias: 'set_antialias(true)',
      premultipliedAlpha: 'set_premultiplied_alpha(true)',
      preserveDrawingBuffer: 'set_preserve_drawing_buffer(false)',
      powerPreference: 'set_power_preference(WebGlPowerPreference::LowPower)',
    };
    expect(Object.keys(WEBGL_ATTRIBUTES).sort()).toEqual(Object.keys(expected).sort());
    for (const call of Object.values(expected)) expect(RUST).toContain(`attributes.${call}`);
    expect(WEBGL_ATTRIBUTES).toEqual({
      alpha: true,
      depth: true,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    });
  });
});

describe('initialisation en tâches courtes', () => {
  it('crée le contexte avant la scène, chaque étape après avoir rendu la main', async () => {
    const order: string[] = [];
    const h = createHarness(theme);
    const real = h.env.loadScene;
    h.env.loadScene = async () => {
      const factory = await real();
      return {
        prepare: (canvas) => {
          order.push('prepare');
          factory.prepare?.(canvas);
        },
        create: (canvas, input) => {
          order.push('create');
          return factory.create(canvas, input);
        },
      };
    };
    await createInstance(h.canvas, data, theme, { options: {}, env: h.env });
    expect(order).toEqual(['prepare', 'create']);
  });

  it('démarre une instance complète malgré les étapes asynchrones', async () => {
    const { handle } = await start();
    expect(typeof handle.destroy).toBe('function');
  });
});

describe('yieldToMain', () => {
  it('utilise scheduler.yield quand il existe', async () => {
    const spy = vi.fn(() => Promise.resolve());
    vi.stubGlobal('scheduler', { yield: spy });
    await yieldToMain();
    vi.unstubAllGlobals();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('sinon passe par un message de canal, sans bloquer', async () => {
    vi.stubGlobal('scheduler', undefined);
    await expect(yieldToMain()).resolves.toBeUndefined();
    vi.unstubAllGlobals();
  });
});
