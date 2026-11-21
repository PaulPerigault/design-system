import type { FallbackReason, Theme } from './types.ts';

export interface InitOptions {
  /** Plafond du rapport de pixels (défaut 2). */
  readonly dprMax?: number;
  /** Étape active au départ, anneau d'accent (défaut : aucune). `@goal` désigne l'objectif. */
  readonly activeId?: string;
  /** Médaille choisie sur le canvas (clic ou toucher). Entrée au clavier : c'est le HTML. */
  readonly onSelect?: (id: string) => void;
  /** Étape sous le pointeur, `null` quand il la quitte (appelé à chaque changement seulement). */
  readonly onHover?: (id: string | null) => void;
  readonly onFallback?: (reason: FallbackReason) => void;
  /** Le badge d'un jalon n'a pas pu être chargé : la médaille reste sans badge. */
  readonly onTextureError?: (id: string) => void;
  /** Élément dont les jetons sont lus (défaut : le parent du canvas, sinon `:root`). */
  readonly themeRoot?: Element;
  /** Inclinaison au gyroscope, demandée sur geste là où une autorisation existe (défaut : oui). */
  readonly gyroscope?: boolean;
}

/**
 * Position d'une étape (jalon ou objectif) dans la dernière image dessinée. `x` et `y` : de 0 à 1,
 * origine en haut à gauche du canvas (directement ce que rend le `.wasm`, sans changement de
 * repère). `scale` : rayon de la médaille rapporté à la hauteur du canvas (pixels CSS du rayon =
 * `scale` x hauteur CSS). `visible` : devant la caméra et centre dans le cadre.
 */
export interface MilestoneMark {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly visible: boolean;
}

/** Toute commande planifie une image : la scène n'agit qu'à la prochaine, avec l'horloge de frame. */
export interface MilestonesHandle {
  /** Libère écouteurs, observateurs, boucle de rendu, chargements, ressources GL et contexte. */
  destroy(): void;
  setTheme(theme: Theme): void;
  /** `''` efface l'étape active. Id inconnu : lève `unknown-id`. Ne déplace jamais la caméra. */
  setActive(id: string): void;
  /** De 0 (première étape) à 1 (objectif ou dernier jalon). Non fini : lève `progress`. */
  setProgress(progress: number): void;
  /** Survol programmatique ; `null` ou id inconnu : aucun. N'appelle pas `onHover`. */
  setHover(id: string | null): void;
  /** Progression de l'étape sur le chemin, de 0 à 1 ; -1 si l'identifiant est inconnu. */
  progressOf(id: string): number;
  /** Jalons dans l'ordre fourni, puis l'objectif (`@goal`). Appeler après une image dessinée. */
  project(): readonly MilestoneMark[];
}
