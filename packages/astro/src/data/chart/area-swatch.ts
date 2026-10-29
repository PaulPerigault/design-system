import { SWATCH } from './frame.ts';
import { patternFill } from './bar-patterns.ts';
import type { Swatch } from './swatch.ts';

const RISE = 3;

/** Échantillon d'une aire : un rectangle au motif de la série, coiffé de son contour. */
export const areaSwatch = (id: string, index: number, label: string): Swatch => ({
  index,
  label,
  marks: [
    {
      kind: 'area',
      d: `M0 ${RISE}h${SWATCH.width}v${SWATCH.height - RISE}h-${SWATCH.width}z`,
      fill: patternFill(id, index),
    },
    { kind: 'line', d: `M0 ${RISE}H${SWATCH.width}` },
  ],
});
