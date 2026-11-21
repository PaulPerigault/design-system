// Cibles d'événements à compteurs, faux canvas et observateurs.
import type { Handler, ListenOptions, ListenTarget } from '../src/bag.ts';
import type { MutationWatcher, Observer } from '../src/env.ts';
import type { CanvasLike } from '../src/raw.ts';

export class FakeTarget implements ListenTarget {
  readonly handlers = new Map<string, Set<Handler>>();
  /** Écouteurs posés avec leurs options : le test vérifie la passivité. */
  readonly posed: { type: string; options: ListenOptions | undefined }[] = [];
  adds = 0;
  removes = 0;

  addEventListener(type: string, listener: Handler, options?: ListenOptions): void {
    this.adds += 1;
    this.posed.push({ type, options });
    const set = this.handlers.get(type) ?? new Set<Handler>();
    set.add(listener);
    this.handlers.set(type, set);
  }

  removeEventListener(type: string, listener: Handler): void {
    this.removes += 1;
    this.handlers.get(type)?.delete(listener);
  }

  /** Écouteurs encore posés, tous types confondus. */
  get live(): number {
    return [...this.handlers.values()].reduce((sum, set) => sum + set.size, 0);
  }

  emit(type: string, event: unknown = {}): void {
    for (const handler of [...(this.handlers.get(type) ?? [])]) handler(event);
  }
}

export class FakeCanvas extends FakeTarget implements CanvasLike {
  clientWidth = 400;
  clientHeight = 200;
  readonly parentElement = {};
  readonly ownerDocument = { documentElement: {} };
  getBoundingClientRect() {
    return { left: 10, top: 20, width: 400, height: 200 };
  }
}

export class FakeObserver implements Observer, MutationWatcher {
  static all: FakeObserver[] = [];
  readonly callback: (entries: never[]) => void;
  observed = 0;
  disconnected = 0;
  constructor(callback: (entries: never[]) => void) {
    this.callback = callback;
    FakeObserver.all.push(this);
  }
  observe(): void {
    this.observed += 1;
  }
  /** Déclenche le rappel comme le ferait le navigateur. */
  fire(entries: readonly object[]): void {
    Reflect.apply(this.callback, undefined, [entries]);
  }
  disconnect(): void {
    this.disconnected += 1;
  }
}
