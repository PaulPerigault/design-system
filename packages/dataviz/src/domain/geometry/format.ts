const PRECISION = 2;

/** Nombre de chemin SVG : 2 décimales au plus, sans zéro inutile ni `-0`. */
export const coord = (value: number): string => String(Number(value.toFixed(PRECISION)) + 0);
