import { SWATCH } from './frame.ts';
import type { Swatch } from './swatch.ts';

/** Côté d'une tuile de motif, en unités du viewBox. */
export const TILE = 8;

/**
 * Motif par rang de série, tracé dans la couleur du fond sur la couleur de la série : plein,
 * diagonale montante, points, lignes horizontales, lignes verticales, quadrillage. La couleur ne
 * porte jamais seule une série (WCAG 1.4.1).
 */
export const PATTERN_MARKS: readonly string[] = [
  '',
  'M-2 2l4-4M0 8l8-8M6 10l4-4',
  'M2 2h.01M6 6h.01',
  'M0 2h8M0 6h8',
  'M2 0v8M6 0v8',
  'M4 0v8M0 4h8',
];

/** Identifiant du motif de la série `index`, propre au graphique (`id`). */
export const patternId = (id: string, index: number): string => `${id}-p${index + 1}`;

/** Remplissage d'une série par attribut : renvoi au motif de son rang. */
export const patternFill = (id: string, index: number): string => `url(#${patternId(id, index)})`;

const SWATCH_BAR = { left: 8, width: 12 } as const;

/** Échantillon de légende d'une série de barres : un carré rempli du motif de la série. */
export const barSwatch = (id: string, index: number, label: string): Swatch => ({
  index,
  label,
  marks: [
    {
      kind: 'bar',
      d: `M${SWATCH_BAR.left} 0h${SWATCH_BAR.width}v${SWATCH.height}h-${SWATCH_BAR.width}z`,
      fill: patternFill(id, index),
    },
  ],
});
