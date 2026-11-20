// Une instance : une scène du `.wasm`, ses écouteurs, sa boucle de rendu à la demande.
import { DPR_MAX_DEFAULT } from './constants.ts';
import { watchContext } from './context.ts';
import { parseFault } from './error.ts';
import { createGyroscope } from './gyroscope.ts';
import { bindPointer } from './pointer.ts';
import type { Session } from './session.ts';
import { watchSize } from './surface.ts';
import { watchTheme } from './theme-watch.ts';
import type { MilestonesHandle } from './types.ts';
import { watchVisibility } from './visibility.ts';

function wireWatchers(s: Session): void {
  const { canvas, scene, env, bag } = s;
  const requested = s.options.dprMax;
  const dprMax = requested !== undefined && requested > 0 ? requested : DPR_MAX_DEFAULT;
  watchSize({ canvas, scene, env, bag, dprMax }, s.redraw);
  watchContext({ canvas, scene, env, bag, redraw: s.redraw, fail: s.fail });
  const html = canvas.ownerDocument.documentElement;
  const root = s.options.themeRoot ?? canvas.parentElement ?? html;
  watchTheme({ env, bag, html, root, apply: s.apply });
  watchVisibility(canvas, s.loop, env, bag);
}

function wireInput(s: Session): void {
  const { canvas, scene, env, bag, options } = s;
  const gyro =
    options.gyroscope === false
      ? undefined
      : createGyroscope({ target: env.window, orientation: env.orientation }, bag, (tilt) => {
          scene.setGyro(tilt?.x ?? Number.NaN, tilt?.y ?? Number.NaN);
          s.redraw();
        });
  bindPointer(canvas, scene, bag, {
    redraw: s.redraw,
    now: s.time,
    touchGesture: () => void gyro?.requestFromGesture(),
    select(id) {
      scene.setActive(id, s.time());
      s.redraw();
      options.onSelect?.(id);
    },
  });
}

/** Branche tout, demande la première image et rend la poignée publique. */
export function startSession(s: Session): MilestonesHandle {
  wireWatchers(s);
  wireInput(s);
  s.redraw();
  return {
    destroy: s.destroy,
    setTheme(theme) {
      if (!s.isDestroyed()) s.apply(theme);
    },
    setActive(id) {
      if (s.isDestroyed()) return;
      try {
        s.scene.setActive(id, s.time());
      } catch (raised) {
        throw parseFault(raised);
      }
      s.redraw();
    },
  };
}
