/**
 * Mise en route de la scène d'un composant : canvas, `init` du paquet 3D, repère d'étapes,
 * étiquettes, pilotage et clavier. Tout échec appelle `revert` : retour à la liste, sans message.
 */
import { addKeys } from './milestones-3d-keys';
import { addLabels } from './milestones-3d-labels';
import { createPilot, type Mode, type Pilot } from './milestones-3d-pilot';
import { addSteps, type Steps } from './milestones-3d-steps';
import type { Env, Scene, SceneModule } from './milestones-3d-types';
import { clearTrackSteps, ids, resetDetail, type Parts } from './milestones-3d-view';

const STATE = 'data-state';
const FIRST = 0;

function makeCanvas(host: Element): HTMLCanvasElement {
  const canvas = host.ownerDocument.createElement('canvas');
  canvas.className = 'pp-milestones__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.tabIndex = -1;
  return canvas;
}

interface Live {
  scene?: Scene;
  steps?: Steps;
  pilot?: Pilot;
  cleanups: (() => void)[];
}

/** Retour au rendu classique : idempotent, sans effet si rien n'a été amélioré. */
function reverter(parts: Parts, canvas: HTMLCanvasElement, live: Live): () => void {
  let done = false;
  return (): void => {
    if (done) return;
    done = true;
    live.cleanups.forEach((cleanup) => cleanup());
    live.pilot?.stop();
    live.steps?.remove();
    live.scene?.destroy();
    clearTrackSteps(parts);
    resetDetail(parts);
    canvas.remove();
    ['data-state', 'data-mode'].forEach((name) => parts.host.removeAttribute(name));
  };
}

const modeOf = (env: Env): Mode => (env.reducedMotion().matches ? 'steps' : 'scroll');

/** Monte le repère d'étapes, les étiquettes, le pilotage et le clavier ; ajoute leurs retraits. */
function mount(parts: Parts, scene: Scene, env: Env, live: Live): void {
  const steps = addSteps(parts, {
    pick: (id) => live.pilot?.goTo(id),
    hover: (id) => {
      scene.setHover(id);
      live.steps?.hover(id);
    },
    move: (delta) => live.pilot?.move(delta),
  });
  live.steps = steps;
  const labels = addLabels(parts);
  const pilot = createPilot({ parts, scene, env, steps, labels });
  live.pilot = pilot;
  live.cleanups.push(() => labels.remove(), addKeys(parts.host, pilot));
  live.cleanups.push(env.reducedMotion().subscribe(() => pilot.setMode(modeOf(env))));
  pilot.setMode(modeOf(env));
}

export async function start(parts: Parts, mod: SceneModule, env: Env): Promise<void> {
  const first = ids(parts)[FIRST];
  if (first === undefined || !mod.canEnhance(mod.enhanceEnv(true))) return;
  const canvas = makeCanvas(parts.host);
  const live: Live = { cleanups: [] };
  const revert = reverter(parts, canvas, live);
  parts.stage.append(canvas);
  parts.host.setAttribute(STATE, 'loading');
  try {
    live.scene = await mod.init(canvas, parts.data, mod.readTheme(parts.host), {
      activeId: first,
      onSelect: (id) => live.pilot?.goTo(id),
      onHover: (id) => live.steps?.hover(id),
      onFallback: revert,
    });
    mount(parts, live.scene, env, live);
    parts.host.setAttribute(STATE, 'enhanced');
  } catch {
    revert();
  }
}
