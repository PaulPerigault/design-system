import type { GaugeShape, Point, Radii } from '@paulperigault/dataviz';

/** Gabarit d'une jauge, en unités du viewBox : cadre, centre, rayons de la bande et textes. */
export interface GaugeLayout {
  readonly viewBox: string;
  readonly centre: Point;
  readonly radii: Radii;
  /** Valeur : la ligne principale, ancrée au milieu. */
  readonly value: Point;
  readonly zone: Point;
  /** Indication de bornage, sous la zone. */
  readonly note: Point;
  readonly label: Point;
  /** Bornes de l'intervalle, au pied de l'arc : demi-cercle seulement. */
  readonly ends?: { readonly min: Point; readonly max: Point };
  /** Caractères au plus du libellé central avant troncature. */
  readonly labelChars: number;
}

/** Dépassement de l'aiguille de part et d'autre de la bande. */
export const NEEDLE_OVERSHOOT = 8;

export const GAUGE_LAYOUTS: Record<GaugeShape, GaugeLayout> = {
  half: {
    viewBox: '0 0 300 196',
    centre: { x: 150, y: 150 },
    radii: { inner: 100, outer: 130 },
    value: { x: 150, y: 128 },
    zone: { x: 150, y: 146 },
    note: { x: 150, y: 168 },
    label: { x: 150, y: 190 },
    ends: { min: { x: 35, y: 170 }, max: { x: 265, y: 170 } },
    labelChars: 26,
  },
  full: {
    viewBox: '0 0 300 300',
    centre: { x: 150, y: 150 },
    radii: { inner: 100, outer: 130 },
    value: { x: 150, y: 164 },
    zone: { x: 150, y: 186 },
    note: { x: 150, y: 206 },
    label: { x: 150, y: 120 },
    labelChars: 22,
  },
};

/** Maximum par défaut de l'intervalle, en pourcentage. */
export const DEFAULT_MAX = 100;
