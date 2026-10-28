import { LABEL_GAP, PLOT, UNIT_RISE, X_LABEL_DROP } from './frame.ts';
import type { LineModel } from './model.ts';

/** Graduation ou unité, déjà positionnée : `axis` choisit l'ancrage du texte en CSS. */
export interface AxisTick {
  readonly axis: 'x' | 'y' | 'unit';
  readonly x: number;
  readonly y: number;
  readonly label: string;
  /** Ancrage forcé du texte (l'unité des barres verticales finit contre l'axe). */
  readonly align?: 'end';
}

/** Grille, axe de référence et textes d'un graphique : le composant ne fait que les poser. */
export interface AxesModel {
  /** Lignes de la grille : un seul chemin. */
  readonly grid: string;
  /** Axe de référence : le bas du tracé pour une courbe, la base zéro pour des barres. */
  readonly axis: string;
  readonly ticks: readonly AxisTick[];
}

/** Position de l'unité, au-dessus du coin supérieur gauche du tracé. */
export const unitTick = (unit: string): readonly AxisTick[] =>
  unit === '' ? [] : [{ axis: 'unit', x: PLOT.left, y: PLOT.top - UNIT_RISE, label: unit }];

/** Axes d'une courbe : axe en bas du tracé, graduations verticales puis horizontales. */
export function lineAxes(model: LineModel): AxesModel {
  return {
    grid: model.grid,
    axis: `M${PLOT.left} ${PLOT.bottom}H${PLOT.right}`,
    ticks: [
      ...model.yTicks.map(({ y, label }): AxisTick => ({
        axis: 'y',
        x: PLOT.left - LABEL_GAP,
        y,
        label,
      })),
      ...model.xTicks.map(({ x, label }): AxisTick => ({
        axis: 'x',
        x,
        y: PLOT.bottom + X_LABEL_DROP,
        label,
      })),
      ...unitTick(model.unit),
    ],
  };
}
