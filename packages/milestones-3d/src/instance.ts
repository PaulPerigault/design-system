// Une instance : une scène du `.wasm`, ses écouteurs, sa boucle de rendu à la demande.
import { DPR_MAX_DEFAULT } from './constants.ts';
import { watchContext } from './context.ts';
import { createHandle } from './handle.ts';
import { createGyroscope } from './gyroscope.ts';
import type { MilestonesHandle } from './options.ts';
import type { Plan } from './plan.ts';
import { bindPointer } from './pointer.ts';
import type { Session } from './session.ts';
import { watchSize } from './surface.ts';
import { scheduleTextures } from './textures.ts';
import { watchTheme } from './theme-watch.ts';
import { watchVisibility } from './visibility.ts';

function wireWatchers(s: Session): void {
  const { canvas, scene, env, bag } = s;
  const requested = s.options.dprMax;
  const dprMax = requested !== undefined && requested > 0 ? requested : DPR_MAX_DEFAULT;
  s.flushSize = watchSize({ canvas, scene, env, bag, dprMax }, s.redraw);
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
  let hovered: string | null = null;
  bindPointer(canvas, scene, bag, {
    redraw: s.redraw,
    touchGesture: () => void gyro?.requestFromGesture(),
    hover(id) {
      if (id === hovered) return;
      hovered = id;
      scene.setHover(id ?? '');
      options.onHover?.(id);
    },
    select: (id) => options.onSelect?.(id),
  });
}

/** Branche tout, demande la première image, programme les badges et rend la poignée. */
export function startSession(s: Session, plan: Plan): MilestonesHandle {
  wireWatchers(s);
  wireInput(s);
  s.redraw();
  scheduleTextures(s, plan.jobs);
  return createHandle(s, plan);
}
