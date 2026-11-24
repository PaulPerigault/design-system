/**
 * Fonctionnement d'un pilote : état mutable (`Run`), lecture de la progression de défilement,
 * image de la boucle, saut et défilement vers une étape. Voir `milestones-3d-pilot.ts`.
 */
import type { Active } from './milestones-3d-active';
import type { Badges } from './milestones-3d-badges';
import type { Labels } from './milestones-3d-labels';
import type { Loop } from './milestones-3d-loop';
import { moved } from './milestones-3d-moved';
import { isNear, nearestIndex, scrollProgress, scrollTarget } from './milestones-3d-progress';
import type { Steps } from './milestones-3d-steps';
import type { Env, Mark, Scene } from './milestones-3d-types';
import type { Parts } from './milestones-3d-view';

export type Mode = 'scroll' | 'steps';

export interface PilotContext {
  parts: Parts;
  scene: Scene;
  env: Env;
  steps: Steps;
  labels: Labels;
  badges: Badges;
}

/** État mutable d'un pilote ; les fonctions ci-dessous le font évoluer. */
export interface Run extends PilotContext {
  order: string[];
  progresses: number[];
  active: Active;
  loop: Loop;
  mode: Mode;
  progress: number;
  marks: readonly Mark[];
  unscroll: (() => void) | null;
}

export const START = 0;
/** Écart de défilement (pixels) sous lequel on est « déjà au bon endroit ». */
const ARRIVED_PX = 1;

/** Mode `scroll` : progression lue dans la piste ; rend vrai si elle a changé. */
export function follow(run: Run): boolean {
  const { track } = run.parts;
  const rect = track.getBoundingClientRect();
  const p = scrollProgress(rect.top, rect.height, run.env.viewportHeight());
  const changed = p !== run.progress;
  run.progress = p;
  if (changed) run.scene.setProgress(p);
  const at = nearestIndex(run.progresses, p);
  run.active.show(at, isNear(run.progresses, at, p));
  return changed;
}

/** Une image : progression (mode `scroll`), puis badges et étiquettes ; vrai tant que quelque chose bouge. */
export function tick(run: Run): boolean {
  const changed = run.mode === 'scroll' ? follow(run) : false;
  const next = run.scene.project();
  const shifted = moved(run.marks, next);
  run.marks = next;
  run.badges.update(next);
  run.labels.update(next);
  return changed || shifted;
}

/** Saute à l'étape sans défilement : caméra, étape active et panneau. */
export function jump(run: Run, at: number): void {
  run.progress = run.progresses[at] ?? START;
  run.scene.setProgress(run.progress);
  run.active.show(at, true);
  run.loop.kick();
}

/** Mode `scroll` : fait défiler la page jusqu'à l'étape, ou saute si on y est déjà. */
export function scrollTo(run: Run, at: number): void {
  const { env } = run;
  const rect = run.parts.track.getBoundingClientRect();
  const track = { top: rect.top + env.scrollY(), height: rect.height };
  const top = scrollTarget(run.progresses[at] ?? START, track, env.viewportHeight());
  if (Math.abs(top - env.scrollY()) < ARRIVED_PX) jump(run, at);
  else env.scrollTo(top, !env.reducedMotion().matches);
}

export const goAt = (run: Run, at: number): void =>
  run.mode === 'scroll' ? scrollTo(run, at) : jump(run, at);
