/** Contrats entre le comportement de Milestones3D et le paquet 3D (injectables dans les tests). */

/** Position écran d'une étape (`project()` du paquet 3D) : x et y de 0 à 1, origine en haut. */
export interface Mark {
  id: string;
  x: number;
  y: number;
  scale: number;
  visible: boolean;
}

/** Poignée du paquet 3D, réduite à ce que le comportement emploie. */
export interface Scene {
  destroy(): void;
  setActive(id: string): void;
  setProgress(progress: number): void;
  setHover(id: string | null): void;
  progressOf(id: string): number;
  project(): readonly Mark[];
}

export interface SceneOptions {
  activeId?: string;
  onSelect(id: string): void;
  onHover(id: string | null): void;
  onFallback(reason: string): void;
  onTextureError?(id: string): void;
}

export interface SceneModule {
  canEnhance(env: unknown): boolean;
  enhanceEnv(visible: boolean): unknown;
  readTheme(root: Element): unknown;
  init(
    canvas: HTMLCanvasElement,
    data: unknown,
    theme: unknown,
    options: SceneOptions,
  ): Promise<Scene>;
}

/** Plateforme du pilotage (défilement, image, mouvement réduit), injectée pour les tests. */
export interface Env {
  /** Préférence « mouvement réduit » ; `subscribe` rend la fonction qui retire l'écoute. */
  reducedMotion(): { matches: boolean; subscribe(callback: () => void): () => void };
  scrollY(): number;
  viewportHeight(): number;
  /** Défile vers une position de page ; `smooth` : défilement animé, sinon saut. */
  scrollTo(top: number, smooth: boolean): void;
  /** Écouteur de défilement passif ; rend la fonction qui le retire. */
  onScroll(callback: () => void): () => void;
  /** Planifie une image (`requestAnimationFrame`) ; rend l'annulation. */
  frame(callback: () => void): () => void;
}

export interface Deps {
  load(): Promise<SceneModule>;
  early(): string | null;
  ready(host: Element): Promise<void>;
  env: Env;
}
