import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';
import type { Pixel } from '../geometry/line-path.ts';
import { segmentsOf } from '../geometry/line-path.ts';
import { relativeCurve } from '../geometry/relative-curve.ts';
import type { Variation } from '../kpi/variation.ts';
import { extremesOf } from './extremes.ts';
import { lastPoint, markerOf, plotPoints, scalesOf, trendOf } from './plot.ts';
import { keptIndices } from './reduce.ts';
import type { SparklineInput } from './validate.ts';
import { validateSparkline } from './validate.ts';

/** Repère sur le tracé : position en unités du viewBox, valeur d'origine. */
export interface Marker extends Pixel {
  readonly index: number;
  readonly value: number;
}

export interface SparklineGeometry {
  readonly width: number;
  readonly height: number;
  /** Attribut `d` : un sous-chemin par suite continue d'au moins deux points, rien dans un trou. */
  readonly d: string;
  /** Points sans voisin : le trait n'en dessine rien, à marquer. */
  readonly isolated: readonly Pixel[];
  /** Dernier point non nul, celui qu'on étiquette. */
  readonly end: Marker;
  readonly min: Marker;
  readonly max: Marker;
  /** Vrai si la série finit par une donnée manquante : `end` n'est alors pas la dernière valeur. */
  readonly trailingGap: boolean;
  /** Nombre de valeurs manquantes de la série d'entrée. */
  readonly missing: number;
  /** Du premier au dernier point non nul ; `null` avec un seul point. */
  readonly trend: Variation | null;
}

/**
 * Géométrie d'une sparkline : tracé sans axes, étendue verticale = [minimum, maximum] des valeurs,
 * point final, extrêmes, trous (le tracé se rompt, rien n'est inventé), tendance du premier au
 * dernier point. Sous 120 points on garde tout ; au-delà, LTTB plus les deux extrêmes. Erreurs :
 * voir `validateSparkline` et `keptIndices`.
 */
export function sparkline(input: SparklineInput): Result<SparklineGeometry> {
  const checked = validateSparkline(input);
  if (!checked.ok) return checked;
  const { values, xs, width, height } = checked.value;
  const extremes = extremesOf(values);
  if (extremes === null) return fail('sparkline.no-data', 'Aucune valeur à tracer.', 'values');
  const scales = scalesOf(xs, extremes.min.value, extremes.max.value, checked.value);
  if (!scales.ok) return scales;
  const kept = keptIndices(xs, values, extremes);
  if (!kept.ok) return kept;
  const segments = segmentsOf(plotPoints(checked.value, scales.value, kept.value));
  const end = lastPoint(values);
  return ok({
    width,
    height,
    d: segments
      .filter((s) => s.length > 1)
      .map(relativeCurve)
      .join(''),
    isolated: segments.flatMap((s) => (s.length === 1 && s[0] ? [s[0]] : [])),
    end: markerOf(end, xs, scales.value),
    min: markerOf(extremes.min, xs, scales.value),
    max: markerOf(extremes.max, xs, scales.value),
    trailingGap: end.index !== values.length - 1,
    missing: values.filter((value) => value === null).length,
    trend: trendOf(values, end),
  });
}
