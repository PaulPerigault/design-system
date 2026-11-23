/** Bornes du contrat de données (ADR-0012, décision 1 ; ADR-0013, décision 1). */
export const MIN_MILESTONES = 1;
export const MAX_MILESTONES = 24;
/** Longueur maximale du `code` d'un jalon (code d'examen), en caractères. */
export const MAX_CODE_LENGTH = 16;
/** Identifiant réservé de l'objectif dans la scène (refusé pour un jalon : `@` n'est pas admis). */
export const GOAL_ID = '@goal';

/** Textures de badge (ADR-0013, décision 2) : côté maximal en pixels et chargements simultanés. */
export const TEXTURE_MAX_PX = 512;
export const TEXTURE_CONCURRENCY = 2;
/** Attente maximale du temps libre du navigateur avant de charger les badges, en ms. */
export const IDLE_TIMEOUT_MS = 1000;

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
  /** Même jeton que `bg`, lu en mode clair : support clair fixe de la médaille (ADR-0013). */
  paper: '--pp-color-bg',
  durationBase: '--pp-duration-base',
  durationFast: '--pp-duration-fast',
  easing: '--pp-easing-standard',
} as const;

/** Ordre des couleurs dans le tableau reçu par le `.wasm` (voir `pp-milestones::theme`). */
export const COLOR_ORDER = ['bg', 'fg', 'accent', 'onAccent', 'line', 'muted', 'paper'] as const;

/** Repli d'une durée illisible : aucune animation, jamais un mouvement inventé. */
export const FALLBACK_DURATION_MS = 0;
/** Repli d'une courbe non reconnue : progression linéaire. */
export const FALLBACK_EASING = [0, 0, 1, 1] as const;

/**
 * Attributs du contexte WebGL2, miroir de `pp-milestones-wasm/src/gl.rs` (un test le vérifie).
 * Le contexte est créé ici d'abord, dans sa propre tâche : un contexte logiciel coûte environ 26 ms
 * avec le processeur ralenti 4 fois, et formerait avec le reste de la scène une tâche longue.
 */
export const WEBGL_ATTRIBUTES = {
  alpha: true,
  depth: true,
  antialias: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  powerPreference: 'low-power',
} as const;

/** Initialisation du GPU par étapes : pause entre deux lectures d'un shader en cours de compilation. */
export const GPU_WAIT_MS = 4;
/** Durée maximale d'attente de la compilation des shaders avant le repli, en ms. */
export const GPU_TIMEOUT_MS = 10_000;

/** Préchauffage du tracé (voir `warmup.ts`) : attente maximale de la clôture du GPU, en ms. */
export const WARM_TIMEOUT_MS = 3000;
