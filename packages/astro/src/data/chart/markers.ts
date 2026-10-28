/**
 * Marqueurs de séries : une forme par indice, pour que la couleur ne porte jamais seule
 * l'identité d'une série (WCAG 1.4.1). Chemins relatifs de rayon 4, centrés sur le point.
 */
const SHAPES = [
  'm-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0z',
  'm-4-4h8v8h-8z',
  'm0-6l6 6l-6 6l-6-6z',
  'm0-5l5 9h-10z',
  'm0 5l5-9h-10z',
  'm-1.5-4h3v2.5h2.5v3h-2.5v2.5h-3v-2.5h-2.5v-3h2.5z',
] as const;

const PRECISION = 2;
const round = (value: number): string => String(Number(value.toFixed(PRECISION)) + 0);

/** Chemin du marqueur de la série `index` (0 à 5) au point (`x`, `y`). */
export function markerPath(index: number, x: number, y: number): string {
  const shape = SHAPES[index % SHAPES.length] ?? SHAPES[0];
  return `M${round(x)} ${round(y)}${shape}`;
}
