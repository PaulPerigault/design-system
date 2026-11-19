// Valeurs relevées dans trois moteurs réels (Playwright, 2026-11-19) par une sonde qui applique
// chaque jeton de tokens.css à la propriété `color` d'un élément, puis lit `getComputedStyle`.
// Régénérable : `node packages/milestones-3d/scripts/capture-colors.mjs` (voir le README).
import raw from './computed-colors.json' with { type: 'json' };

export interface EngineSample {
  readonly engine: string;
  readonly version: string;
  readonly tokens: Readonly<Record<'light' | 'dark', Readonly<Record<string, string>>>>;
  /** Couleur CSS écrite, puis valeur calculée rendue par le moteur. */
  readonly forms: Readonly<Record<string, string>>;
  /** Texte brut de propriétés personnalisées (non calculées) et durée/courbe de transition. */
  readonly raw: Readonly<Record<string, string>>;
}

export const SAMPLES: readonly EngineSample[] = raw;
