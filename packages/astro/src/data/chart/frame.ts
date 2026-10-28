/** Gabarit commun des graphiques : unités du viewBox, marges et budgets (ADR-0007). */
export const WIDTH = 420;
export const HEIGHT = 250;

const MARGIN = { top: 28, right: 20, bottom: 36, left: 72 } as const;

export const PLOT = {
  left: MARGIN.left,
  right: WIDTH - MARGIN.right,
  top: MARGIN.top,
  bottom: HEIGHT - MARGIN.bottom,
} as const;

const HALF = 0.5;
export const PLOT_CENTER = (PLOT.left + PLOT.right) * HALF;
/** Distance entre l'axe horizontal et la ligne de base de ses libellés. */
export const X_LABEL_DROP = 16;
/** Échantillon de légende : un trait et un marqueur, centrés. */
export const SWATCH = { width: 28, height: 12, midX: 14, midY: 6 } as const;

export const Y_TICKS = 5;
export const X_TICKS = 5;
export const MARKER_RADIUS = 4;
/** Au-delà, seuls les points isolés et le dernier point reçoivent un marqueur. */
export const MARKER_LIMIT = 24;
/** Plafond de points par série (ADR-0007) et budget de points par graphique (10 ko bruts). */
export const MAX_POINTS_PER_SERIES = 500;
export const POINT_BUDGET = 500;
/** Écart entre les graduations et leur libellé. */
export const LABEL_GAP = 8;
export const UNIT_RISE = 12;

const DECIMALS = 2;
/** Coordonnée d'attribut : 2 décimales au plus (le poids du SVG est budgété). */
export const px = (value: number): number => Number(value.toFixed(DECIMALS));
