// Rendu à la demande : une image n'est demandée que quand quelque chose a changé ou bouge. Aucune
// boucle au repos (ADR-0012, décision 5) ; en pause (hors écran, onglet masqué), rien n'est planifié.
export interface LoopDeps {
  requestFrame(callback: (time: number) => void): number;
  cancelFrame(id: number): void;
}

export interface Loop {
  /** Demande une image (sans effet si une est déjà planifiée, ou en pause). */
  request(): void;
  setPaused(paused: boolean): void;
  /** Annule l'image planifiée et interdit toute nouvelle demande. */
  stop(): void;
  readonly scheduled: boolean;
}

/** `draw` dessine une image et rend vrai tant qu'une autre est due. */
export function createLoop(draw: (time: number) => boolean, deps: LoopDeps): Loop {
  let id: number | undefined;
  let paused = false;
  let stopped = false;

  const tick = (time: number): void => {
    id = undefined;
    if (stopped || paused) return;
    if (draw(time)) request();
  };
  function request(): void {
    if (stopped || paused || id !== undefined) return;
    id = deps.requestFrame(tick);
  }
  const cancel = (): void => {
    if (id !== undefined) deps.cancelFrame(id);
    id = undefined;
  };
  return {
    request,
    setPaused(next) {
      paused = next;
      if (paused) cancel();
      else request();
    },
    stop() {
      stopped = true;
      cancel();
    },
    get scheduled() {
      return id !== undefined;
    },
  };
}
