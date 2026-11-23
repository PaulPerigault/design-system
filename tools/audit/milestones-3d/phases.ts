// Phases d'initialisation de la scène (marques `pp3d:*` du paquet 3D) : une tâche longue est décrite
// avec les phases qui la recouvrent, pour que la ligne d'échec dise laquelle déborde.

export interface Phase {
  name: string;
  start: number;
  duration: number;
}

export interface LongTask {
  start: number;
  duration: number;
}

const ms = (value: number): string => `${value.toFixed(0)} ms`;

const overlaps = (task: LongTask, phase: Phase): boolean =>
  phase.start < task.start + task.duration && task.start < phase.start + phase.duration;

/** Phases dans l'ordre, avec leur durée : « load-wasm 40 ms, create-scene 31 ms… ». */
export function describePhases(phases: readonly Phase[]): string {
  if (phases.length === 0) return 'aucune marque (paquet sans marques ou .wasm absent)';
  const sorted = [...phases].sort((a, b) => a.start - b.start);
  return sorted.map((p) => `${p.name} ${ms(p.duration)}`).join(', ');
}

/** « aucune », ou chaque tâche : début relatif au chargement, durée, phases recouvertes. */
export function describeTasks(
  tasks: readonly LongTask[],
  phases: readonly Phase[],
  loading: number,
): string {
  if (tasks.length === 0) return 'aucune';
  const lines = tasks.map((task) => {
    const covered = phases.filter((phase) => overlaps(task, phase));
    const names = covered.map((p) => `${p.name} ${ms(p.duration)}`).join(' + ');
    return `+${ms(task.start - loading)} ${ms(task.duration)} : ${names || 'hors phases du paquet 3D (comportement du composant, sonde, GPU)'}`;
  });
  return `${tasks.length} tâche(s) ; ${lines.join(' ; ')} ; phases : ${describePhases(phases)}`;
}

/** Marge après le tracé de la première image : sa composition par le navigateur. */
const COMPOSE_MS = 100;

/**
 * Fenêtre d'init : jusqu'à la première image réellement tracée (après le préchauffage, donc plus
 * tard que le premier tick d'image) et sa composition ; `drawn` est la fin de ce tracé, ou null.
 */
export function initWindow(
  ticked: number,
  phases: readonly Phase[],
): { end: number; drawn: number | null } {
  const real = phases.find((phase) => phase.name === 'first-frame');
  const drawn = real ? real.start + real.duration : null;
  return { end: Math.max(ticked, drawn === null ? 0 : drawn + COMPOSE_MS), drawn };
}
