import type { Axis, Dataset, SparklineGeometry } from '@paulperigault/dataviz';
import { parseIsoDate, sparkline } from '@paulperigault/dataviz';
import { unwrap } from './errors.ts';
import { markerPath } from './markers.ts';

/** Gabarit d'une sparkline, en unités du viewBox : la marge laisse la place des marqueurs. */
export const SPARK = { width: 360, height: 64, padding: 8 } as const;

/** Indice de forme (`markers.ts`) par repère : cercle, triangle pointe en haut, pointe en bas, carré. */
export const SHAPE = { end: 0, max: 3, min: 4, point: 1 } as const;

export type MarkKind = keyof typeof SHAPE;

export interface SparkMark {
  readonly kind: MarkKind;
  readonly d: string;
}

export interface SparkModel {
  readonly viewBox: string;
  /** Tracé de la courbe : un sous-chemin par suite continue, rien dans un trou. */
  readonly d: string;
  /** Repères dans l'ordre de dessin : le point final passe en dernier, donc au-dessus. */
  readonly marks: readonly SparkMark[];
  readonly geometry: SparklineGeometry;
}

/** Abscisses du tracé : dates en millisecondes UTC (`parseIsoDate`), nombres tels quels, catégories par rang. */
export function abscissas(axis: Axis, name: string): number[] {
  if (axis.kind === 'number') return [...axis.values];
  if (axis.kind === 'category') return axis.values.map((_, index) => index);
  return axis.values.map((iso) => unwrap(name, parseIsoDate(iso)));
}

interface Pixel {
  readonly x: number;
  readonly y: number;
}

const keyOf = ({ x, y }: Pixel): string => `${x},${y}`;

/**
 * Repères dans l'ordre de dessin. Le point final, le plus haut et le plus bas se superposent
 * quand ils coïncident (la pointe du triangle dépasse du cercle) : chacun reste lisible. Un point
 * isolé qui tombe sur l'un d'eux n'est pas redessiné.
 */
function marksOf(geometry: SparklineGeometry): SparkMark[] {
  const { end, max, min, isolated } = geometry;
  const named: [MarkKind, Pixel][] = [
    ['min', min],
    ['max', max],
    ['end', end],
  ];
  const taken = new Set(named.map(([, at]) => keyOf(at)));
  const points = isolated.filter((at) => !taken.has(keyOf(at)));
  return [...points.map((at): [MarkKind, Pixel] => ['point', at]), ...named].map(([kind, at]) => ({
    kind,
    d: markerPath(SHAPE[kind], at.x, at.y),
  }));
}

/** Géométrie de la série unique du jeu ; les erreurs de `dataviz` font échouer le build. */
export function buildSparkModel(dataset: Dataset, name: string): SparkModel {
  const values = dataset.series[0]?.values ?? [];
  const xs = abscissas(dataset.x, name);
  const geometry = unwrap(name, sparkline({ values, xs, ...SPARK }));
  return {
    viewBox: `0 0 ${SPARK.width} ${SPARK.height}`,
    d: geometry.d,
    marks: marksOf(geometry),
    geometry,
  };
}
