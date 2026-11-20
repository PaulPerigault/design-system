/** Contrats entre le comportement de Milestones3D et le paquet 3D (injectables dans les tests). */

/** Ce que le comportement attend du paquet 3D (sous-ensemble de son API publique). */
export interface Scene {
  destroy(): void;
  setActive(id: string): void;
}
export interface SceneModule {
  canEnhance(env: unknown): boolean;
  enhanceEnv(visible: boolean): unknown;
  readTheme(root: Element): unknown;
  init(
    canvas: HTMLCanvasElement,
    data: unknown,
    theme: unknown,
    options: { activeId: string; onSelect(id: string): void; onFallback(reason: string): void },
  ): Promise<Scene>;
}

export interface Deps {
  load(): Promise<SceneModule>;
  early(): string | null;
  ready(host: Element): Promise<void>;
}
