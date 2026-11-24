/**
 * Pilotage de la scène (ADR-0013, décision 3). Mode `scroll` : la position de défilement dans la
 * piste donne la progression `p` (lue dans une image, écouteur passif), jamais de détournement du
 * défilement. Mode `steps` (mouvement réduit) : pas de piste haute, la scène saute d'étape en
 * étape. Dans les deux modes l'étape active et le panneau suivent la caméra.
 */
import { createActive } from './milestones-3d-active';
import { createLoop } from './milestones-3d-loop';
import { stepIndex } from './milestones-3d-progress';
import {
  START,
  goAt,
  jump,
  tick,
  type Mode,
  type PilotContext,
  type Run,
} from './milestones-3d-run';
import { clearTrackSteps, ids, setTrackSteps } from './milestones-3d-view';

export type { Mode, PilotContext } from './milestones-3d-run';

export interface Pilot {
  goTo(id: string): void;
  move(delta: number): void;
  setMode(mode: Mode): void;
  /** Demande une image (un badge vient de se charger). */
  redraw(): void;
  stop(): void;
}

function setMode(run: Run, mode: Mode): void {
  run.mode = mode;
  run.parts.host.setAttribute('data-mode', mode);
  run.unscroll?.();
  run.unscroll = null;
  if (mode === 'scroll') {
    setTrackSteps(run.parts, run.order.length);
    run.unscroll = run.env.onScroll(run.loop.kick);
    run.loop.kick();
  } else {
    clearTrackSteps(run.parts);
    jump(run, Math.max(START, run.active.index()));
  }
}

export function createPilot(context: PilotContext): Pilot {
  const order = ids(context.parts);
  const loop = createLoop(context.env, () => tick(run));
  const run: Run = {
    ...context,
    order,
    progresses: order.map((id) => context.scene.progressOf(id)),
    active: createActive(context),
    loop,
    mode: 'steps',
    progress: -1,
    marks: [],
    unscroll: null,
  };
  return {
    goTo(id) {
      const at = order.indexOf(id);
      if (at >= START) goAt(run, at);
    },
    move(delta) {
      goAt(run, stepIndex(Math.max(START, run.active.index()), delta, order.length));
    },
    setMode: (mode) => setMode(run, mode),
    redraw: loop.kick,
    stop() {
      run.unscroll?.();
      run.loop.stop();
    },
  };
}
