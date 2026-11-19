/** Bornes du contrat de données (ADR-0012, décision 1). */
export const MIN_MILESTONES = 1;
export const MAX_MILESTONES = 24;

/** Délai laissé au navigateur pour restaurer un contexte perdu, avant le repli définitif. */
export const CONTEXT_RESTORE_TIMEOUT_MS = 2000;
/** Rapport de pixels maximal par défaut : au-delà, le coût GPU n'apporte rien à l'œil. */
export const DPR_MAX_DEFAULT = 2;

/** Appareil faible : au plus ce nombre de cœurs, ou au plus cette mémoire (Go). */
export const WEAK_CORES = 2;
export const WEAK_MEMORY_GB = 2;

/** Gyroscope : angle de tenue neutre de l'appareil et amplitude qui donne l'inclinaison maximale. */
export const GYRO_REST_BETA_DEG = 45;
export const GYRO_RANGE_DEG = 30;

/** Jetons lus par `readTheme` : liste fermée (ADR-0012, décision 4). */
export const THEME_TOKENS = {
  bg: '--pp-color-bg',
  fg: '--pp-color-fg',
  accent: '--pp-color-accent',
  onAccent: '--pp-color-on-accent',
  line: '--pp-color-line',
  muted: '--pp-color-muted',
  durationBase: '--pp-duration-base',
  durationFast: '--pp-duration-fast',
  easing: '--pp-easing-standard',
} as const;

/** Ordre des couleurs dans le tableau reçu par le `.wasm` (voir `pp-milestones::theme`). */
export const COLOR_ORDER = ['bg', 'fg', 'accent', 'onAccent', 'line', 'muted'] as const;

/** Repli d'une durée illisible : aucune animation, jamais un mouvement inventé. */
export const FALLBACK_DURATION_MS = 0;
/** Repli d'une courbe non reconnue : progression linéaire. */
export const FALLBACK_EASING = [0, 0, 1, 1] as const;
