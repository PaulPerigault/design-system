// Registre des écouteurs, observateurs et minuteurs d'une instance : `destroy()` les retire tous.
export type Handler = (event: unknown) => void;

/** Ce que `Bag` exige d'une cible d'événements (un `EventTarget` du DOM convient). */
export interface ListenTarget {
  addEventListener(type: string, listener: Handler): void;
  removeEventListener(type: string, listener: Handler): void;
}

export interface Bag {
  /** Pose un écouteur ; il sera retiré par `disposeAll`. */
  listen(target: ListenTarget, type: string, handler: Handler): void;
  /** Enregistre un nettoyage quelconque (observateur déconnecté, minuteur annulé…). */
  add(dispose: () => void): void;
  /** Nombre de nettoyages en attente : zéro après `disposeAll`. */
  readonly size: number;
  disposeAll(): void;
}

export function createBag(): Bag {
  let disposers: (() => void)[] = [];
  return {
    listen(target, type, handler) {
      target.addEventListener(type, handler);
      disposers.push(() => target.removeEventListener(type, handler));
    },
    add: (dispose) => void disposers.push(dispose),
    get size() {
      return disposers.length;
    },
    disposeAll() {
      const pending = disposers;
      disposers = [];
      for (const dispose of pending.reverse()) dispose();
    },
  };
}
