import { WEBGL_ATTRIBUTES } from './constants.ts';
import { MilestonesError, parseFault } from './error.ts';
import type { CanvasLike, RawScene, SceneFactory, SceneInput } from './raw.ts';

// Produits par `npm run build:wasm` (tools/wasm/build-milestones.ts), à côté de `src/` et `dist/`.
const GLUE = new URL('../wasm/pp_milestones_wasm.js', import.meta.url);
const WASM = new URL('../wasm/pp_milestones_wasm_bg.wasm', import.meta.url);

/** Module wasm-bindgen (`--target web`) : initialisation et classe `Scene`. */
interface Glue {
  default(options: { module_or_path: URL }): Promise<unknown>;
  initSync(options: { module: Uint8Array }): unknown;
  Scene: new (
    canvas: HTMLCanvasElement,
    ids: string[],
    statuses: string[],
    badges: Uint8Array,
    goal: boolean,
    theme: Float32Array,
    active: string,
  ) => RawScene;
}

let loading: Promise<SceneFactory> | undefined;

/** Node : lecture synchrone (tests d'intégration). Ailleurs : wasm-bindgen charge par `fetch`. */
async function start(glue: Glue): Promise<void> {
  const fs = globalThis.process?.getBuiltinModule?.('node:fs');
  if (WASM.protocol === 'file:' && fs) glue.initSync({ module: fs.readFileSync(WASM) });
  else await glue.default({ module_or_path: WASM });
}

function factory(glue: Glue): SceneFactory {
  return {
    prepare(canvas: CanvasLike): void {
      if (typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement) {
        canvas.getContext('webgl2', WEBGL_ATTRIBUTES);
      }
    },
    create(canvas: CanvasLike, input: SceneInput): RawScene {
      if (typeof HTMLCanvasElement === 'undefined' || !(canvas instanceof HTMLCanvasElement)) {
        throw new MilestonesError('gl-unavailable');
      }
      const { ids, statuses, badges, goal, theme, active } = input;
      try {
        return new glue.Scene(canvas, ids, statuses, badges, goal, theme, active);
      } catch (raised) {
        throw parseFault(raised);
      }
    },
  };
}

async function load(): Promise<SceneFactory> {
  try {
    const glue: Glue = await import(/* @vite-ignore */ GLUE.href);
    await start(glue);
    return factory(glue);
  } catch (cause) {
    loading = undefined;
    throw new MilestonesError('load-failed', undefined, { cause });
  }
}

/** Charge et instancie le `.wasm` une seule fois ; `load-failed` s'il ne se charge pas. */
export function loadScene(): Promise<SceneFactory> {
  loading ??= load();
  return loading;
}
