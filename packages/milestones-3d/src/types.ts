export type Status = 'achieved' | 'planned';

/**
 * Image du badge, fournie par le consommateur (même site) et affichée telle quelle en HTML par le
 * composant, jamais plaquée en texture (ADR-0014). `src` : `https:` absolu ou chemin relatif ;
 * jamais `javascript:` ni `data:`. `width` et `height` (pixels, facultatifs) donnent le rapport
 * naturel avant le chargement de l'image.
 */
export interface Badge {
  readonly src: string;
  readonly width?: number;
  readonly height?: number;
}

/**
 * Un jalon. `date` : `AAAA-MM` ou `AAAA-MM-JJ`. `code` : texte simple de 16 caractères au plus.
 * `href` : `https:` ou chemin relatif. `badge` : réservé aux jalons `achieved`.
 */
export interface Milestone {
  readonly id: string;
  readonly label: string;
  readonly status: Status;
  readonly group?: string;
  readonly date?: string;
  readonly code?: string;
  readonly badge?: Badge;
  readonly href?: string;
}

/** Objectif au bout du parcours. Jamais de badge. */
export interface Goal {
  readonly label: string;
  readonly date?: string;
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

export type ThemeColorName = 'bg' | 'fg' | 'accent' | 'onAccent' | 'line' | 'muted' | 'paper';
export type Curve = readonly [x1: number, y1: number, x2: number, y2: number];

export interface Theme {
  /** `paper` : `--pp-color-bg` en mode clair, quelles que soient les préférences. */
  readonly colors: Readonly<Record<ThemeColorName, ThemeColor>>;
  /** `--pp-duration-base` et `--pp-duration-fast`, en millisecondes. */
  readonly durationBase: number;
  readonly durationFast: number;
  /** `--pp-easing-standard` : points de contrôle d'une courbe de Bézier cubique. */
  readonly easing: Curve;
}

/**
 * Raison d'un repli vers le rendu classique (liste, sans 3D). `prefers-reduced-motion` n'en est
 * plus une (ADR-0013, décision 3) : voir `prefersReducedMotion`.
 */
export type FallbackReason =
  | 'no-webgl2'
  | 'save-data'
  | 'weak-device'
  | 'hidden'
  | 'invalid-data'
  | 'invalid-theme'
  | 'load-failed'
  | 'init-failed'
  | 'context-lost';
