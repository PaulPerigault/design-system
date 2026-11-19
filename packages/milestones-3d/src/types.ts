/** Jeu fermé d'emblèmes géométriques fourni par le crate `pp-milestones`. */
export const EMBLEM_KEYS = [
  'disc',
  'check',
  'shield',
  'cloud',
  'network',
  'database',
  'code',
  'key',
  'gear',
] as const;

export type EmblemKey = (typeof EMBLEM_KEYS)[number];
export type Status = 'achieved' | 'planned';

/** Un jalon. `date` : `AAAA-MM` ou `AAAA-MM-JJ`. `href` : `https:` ou chemin relatif. */
export interface Milestone {
  readonly id: string;
  readonly label: string;
  readonly status: Status;
  readonly group?: string;
  readonly date?: string;
  readonly href?: string;
  readonly emblem?: EmblemKey;
}

/** Cible finale facultative, au bout du ruban. */
export interface Goal {
  readonly label: string;
  readonly href?: string;
}

export interface MilestonesData {
  readonly milestones: readonly Milestone[];
  readonly goal?: Goal;
}

/**
 * Couleur lue sur la page, en nombres : sRGB gamma (canaux de 0 à 1) ou OKLCH (clarté de 0 à 1,
 * chroma, teinte en degrés). La conversion en sRGB et le gamut sont faits par le `.wasm`.
 */
export type ThemeColor =
  | { readonly space: 'srgb'; readonly r: number; readonly g: number; readonly b: number }
  | { readonly space: 'oklch'; readonly l: number; readonly c: number; readonly h: number };

export type ThemeColorName = 'bg' | 'fg' | 'accent' | 'onAccent' | 'line' | 'muted';
export type Curve = readonly [x1: number, y1: number, x2: number, y2: number];

export interface Theme {
  readonly colors: Readonly<Record<ThemeColorName, ThemeColor>>;
  /** `--pp-duration-base` et `--pp-duration-fast`, en millisecondes. */
  readonly durationBase: number;
  readonly durationFast: number;
  /** `--pp-easing-standard` : points de contrôle d'une courbe de Bézier cubique. */
  readonly easing: Curve;
}

/** Raison d'un repli vers le rendu classique (liste, sans 3D). */
export type FallbackReason =
  | 'no-webgl2'
  | 'reduced-motion'
  | 'save-data'
  | 'weak-device'
  | 'hidden'
  | 'invalid-data'
  | 'invalid-theme'
  | 'load-failed'
  | 'init-failed'
  | 'context-lost';

export interface InitOptions {
  /** Plafond du rapport de pixels (défaut 2). */
  readonly dprMax?: number;
  /** Jalon actif au départ (défaut : le premier). */
  readonly activeId?: string;
  /** Jalon choisi sur le canvas (clic ou toucher). */
  readonly onSelect?: (id: string) => void;
  readonly onFallback?: (reason: FallbackReason) => void;
  /** Élément dont les jetons sont lus (défaut : le parent du canvas, sinon `:root`). */
  readonly themeRoot?: Element;
  /** Inclinaison au gyroscope, demandée sur geste là où une autorisation existe (défaut : oui). */
  readonly gyroscope?: boolean;
}

export interface MilestonesHandle {
  /** Libère écouteurs, observateurs, boucle de rendu, ressources GL et contexte. Idempotent. */
  destroy(): void;
  setTheme(theme: Theme): void;
  setActive(id: string): void;
}
