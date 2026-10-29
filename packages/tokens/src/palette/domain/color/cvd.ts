import type { Rgb } from '../../../lib/color.ts';

/**
 * Simulation des dichromacies : Machado, Oliveira et Fernandes (2009), « A Physiologically-based
 * Model for Simulation of Color Vision Deficiency », IEEE TVCG 15(6), gravité 1,0.
 * Matrices appliquées en sRGB linéaire.
 */
export type CvdKind = 'protanopia' | 'deuteranopia' | 'tritanopia';

interface Row3 {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}
type Matrix3 = readonly [Row3, Row3, Row3];

export const CVD_KINDS: readonly CvdKind[] = ['protanopia', 'deuteranopia', 'tritanopia'];

export const CVD_MATRICES: Record<CvdKind, Matrix3> = {
  protanopia: [
    { r: 0.152286, g: 1.052583, b: -0.204868 },
    { r: 0.114503, g: 0.786281, b: 0.099216 },
    { r: -0.003882, g: -0.048116, b: 1.051998 },
  ],
  deuteranopia: [
    { r: 0.367322, g: 0.860646, b: -0.227968 },
    { r: 0.280085, g: 0.672501, b: 0.047413 },
    { r: -0.01182, g: 0.04294, b: 0.968881 },
  ],
  tritanopia: [
    { r: 1.255528, g: -0.076749, b: -0.178779 },
    { r: -0.078411, g: 0.930809, b: 0.147602 },
    { r: 0.004733, g: 0.691367, b: 0.3039 },
  ],
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const dot = (row: Row3, { r, g, b }: Rgb): number => row.r * r + row.g * g + row.b * b;

/** Couleur perçue par une personne atteinte, en sRGB linéaire borné à [0, 1]. */
export function simulateCvd(color: Rgb, kind: CvdKind): Rgb {
  const [row1, row2, row3] = CVD_MATRICES[kind];
  return {
    r: clamp01(dot(row1, color)),
    g: clamp01(dot(row2, color)),
    b: clamp01(dot(row3, color)),
  };
}
