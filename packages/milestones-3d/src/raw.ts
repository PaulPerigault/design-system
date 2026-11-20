import type { ListenTarget } from './bag.ts';

/** Ce que la scène attend d'un canvas : un `HTMLCanvasElement` convient, un faux aussi en test. */
export interface CanvasLike extends ListenTarget {
  readonly clientWidth: number;
  readonly clientHeight: number;
  /** Un élément du document (`Element` dans le navigateur) : la racine où lire les jetons. */
  readonly parentElement: object | null;
  readonly ownerDocument: { readonly documentElement: object };
  getBoundingClientRect(): {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
}

/** Surface d'une scène du `.wasm`, telle qu'exposée par wasm-bindgen (crates/pp-milestones-wasm). */
export interface RawScene {
  frame(now: number): boolean;
  resize(width: number, height: number): void;
  setTheme(theme: Float32Array): void;
  setActive(id: string, now: number): void;
  activeId(): string | undefined;
  pointerMove(x: number, y: number): void;
  pointerLeave(): void;
  setGyro(x: number, y: number): void;
  pick(x: number, y: number, now: number): string | undefined;
  contextLost(): void;
  contextRestored(): void;
  destroy(): void;
  free(): void;
}

export interface SceneInput {
  readonly ids: string[];
  readonly statuses: string[];
  readonly emblems: string[];
  readonly goal: boolean;
  readonly theme: Float32Array;
  readonly active: string;
}

/** Crée une scène sur un canvas ; lève un code littéral du `.wasm` en cas de refus. */
export interface SceneFactory {
  /** Crée d'avance le contexte WebGL2 (étape à part, pour ne pas former une tâche longue). */
  prepare?(canvas: CanvasLike): void;
  create(canvas: CanvasLike, input: SceneInput): RawScene;
}
