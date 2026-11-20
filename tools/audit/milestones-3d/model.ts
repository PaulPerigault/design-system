// Modèle de l'audit de Milestones3D : une ligne par contrôle, moteur et scénario.
export type Status = 'ok' | 'fail' | 'skip' | 'info';

export interface Where {
  engine: string;
  scenario: string;
}

export interface Row extends Where {
  check: string;
  status: Status;
  detail: string;
}

export const PAGE = '/components/milestones-3d/';
/** Ancre de la démonstration : la section est à l'écran au chargement, donc la 3D s'y active. */
export const DEMO_HASH = '#demo-3d';
export const HOST = '[data-milestones-demo] .pp-milestones';
export const ENHANCED = `${HOST}[data-state="enhanced"]`;
export const ENGINES = ['chromium', 'firefox', 'webkit'] as const;
export type EngineName = (typeof ENGINES)[number];

export const VIEWPORTS = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

/** Délais en millisecondes. */
export const ENHANCE_TIMEOUT_MS = 20_000;
export const RESTORE_TIMEOUT_MS = 2_000;
export const FALLBACK_MARGIN_MS = 1_500;
export const IDLE_WAIT_MS = 800;

/** Avertissement du rastériseur logiciel de Chromium, émis par tout canvas WebGL2 (vérifié à vide). */
export const SOFTWARE_GL_NOISE = /GL Driver Message .*GPU stall due to ReadPixels/;

/**
 * Firefox signale tout `loseContext()` explicite (vérifié sur une page vide). La page relâche son
 * contexte jetable de détection exprès : le nombre de contextes actifs est plafonné.
 */
export const RELEASED_CONTEXT_NOISE = /WebGL context was lost\./;

/**
 * Firefox signale tout écouteur `deviceorientation` (vérifié sur une page vide). La page l'ajoute
 * exprès : le gyroscope est actif « là où il est disponible sans autorisation » (ADR-0012).
 */
export const ORIENTATION_NOTICE = /Use of the orientation sensor is deprecated\./;

/** Message émis par le navigateur lui-même, pas par la page. */
export const isEngineNoise = (text: string): boolean =>
  [SOFTWARE_GL_NOISE, RELEASED_CONTEXT_NOISE, ORIENTATION_NOTICE].some((re) => re.test(text));

export const at = (engine: string, scenario: string): Where => ({ engine, scenario });

export const row = (where: Where, check: string, ok: boolean, detail: string): Row => ({
  ...where,
  check,
  status: ok ? 'ok' : 'fail',
  detail,
});

export const info = (where: Where, check: string, detail: string): Row => ({
  ...where,
  check,
  status: 'info',
  detail,
});

export const skip = (where: Where, check: string, detail: string): Row => ({
  ...where,
  check,
  status: 'skip',
  detail,
});

/** Première ligne d'une erreur, pour une cellule de tableau. */
export const brief = (error: unknown): string =>
  (error instanceof Error ? error.message : String(error)).split('\n')[0] ?? '';
