import { SWATCH } from './frame.ts';
import { markerPath } from './markers.ts';

/** Un tracé de l'échantillon de légende ; `kind` donne la classe `<bloc>__<kind>`. */
export interface SwatchMark {
  readonly kind: string;
  readonly d: string;
  /** Remplissage par attribut (motif `url(#…)`), absent si la classe suffit. */
  readonly fill?: string;
}

export interface Swatch {
  readonly index: number;
  readonly label: string;
  readonly marks: readonly SwatchMark[];
  /** Teinte imposée (zone d'une jauge) : attribut `data-tone`. */
  readonly tone?: string;
}

/** Échantillon d'une courbe : un trait traversé de son marqueur. */
export const lineSwatch = (index: number, label: string): Swatch => ({
  index,
  label,
  marks: [
    { kind: 'line', d: `M0 ${SWATCH.midY}H${SWATCH.width}` },
    { kind: 'marker', d: markerPath(index, SWATCH.midX, SWATCH.midY) },
  ],
});
