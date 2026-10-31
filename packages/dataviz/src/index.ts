export { createAggregator } from './application/aggregator.ts';
export type { Aggregator, Formatter } from './application/ports.ts';
export type { AggregateSpec, Grouping, Operation } from './domain/aggregate/spec.ts';
export { GROUPINGS, OPERATIONS } from './domain/aggregate/spec.ts';
export type { Axis, Dataset, Series } from './domain/dataset.ts';
export { DATASET_SCHEMA, MAX_POINTS, MAX_SERIES } from './domain/dataset.ts';
export { parseIsoDate } from './domain/iso-date.ts';
export {
  MAX_BAR_CATEGORIES,
  checkBarCategories,
  checkSeriesCount,
  checkSharedUnit,
} from './domain/limits.ts';
export type { Result } from './domain/result.ts';
export { fail, ok } from './domain/result.ts';
export type { DatavizError, ErrorCode } from './errors.ts';
export { createFormatter } from './infrastructure/intl-formatter.ts';
export { parseDataset } from './infrastructure/parse-dataset.ts';
export type { BarRect, BarsInput, Orientation } from './domain/geometry/bars.ts';
export { barRects, rectsPath } from './domain/geometry/bars.ts';
export type { LineGeometry, PathPoint } from './domain/geometry/line-path.ts';
export { linePath } from './domain/geometry/line-path.ts';
export { lttb } from './domain/downsample/lttb.ts';
export { quantile, quantiles } from './domain/stats/quantile.ts';
export type { BandScale } from './domain/scale/band.ts';
export { bandScale } from './domain/scale/band.ts';
export type { Extent, LinearScale } from './domain/scale/linear.ts';
export { linearScale, verticalScale } from './domain/scale/linear.ts';
export type { Ticks } from './domain/scale/ticks.ts';
export { niceTicks } from './domain/scale/ticks.ts';
export type { TimeTicks, TimeUnit } from './domain/scale/time-ticks.ts';
export { timeTicks } from './domain/scale/time-ticks.ts';
export { timeDomain, timeScale } from './domain/scale/time.ts';
export type { AreaGeometry } from './domain/geometry/area-path.ts';
export { areaPath } from './domain/geometry/area-path.ts';
export type { StackLayer } from './domain/geometry/stack.ts';
export { stackSeries } from './domain/geometry/stack.ts';
export type { AngleSpan, Point, Radii } from './domain/geometry/arc-path.ts';
export { FULL_TURN, HALF_TURN, polar, radialLine, sectorPath } from './domain/geometry/arc-path.ts';
export type {
  GaugeRange,
  GaugeReading,
  GaugeShape,
  GaugeZone,
} from './domain/geometry/gauge-scale.ts';
export { GAUGE_SPANS, gaugeReading, gaugeZones, zoneIndex } from './domain/geometry/gauge-scale.ts';
export type { KpiInput, KpiModel } from './application/build-kpi.ts';
export { buildKpi } from './application/build-kpi.ts';
export type { Direction, Variation } from './domain/kpi/variation.ts';
export { directionOf, variation } from './domain/kpi/variation.ts';
export { MAX_INTEGER_DIGITS, checkReadable } from './domain/kpi/readable.ts';
export type { VariationText } from './domain/kpi/words.ts';
export { variationText } from './domain/kpi/words.ts';
export type { Extremes, Extremum } from './domain/sparkline/extremes.ts';
export { extremesOf } from './domain/sparkline/extremes.ts';
export { MAX_SPARKLINE_POINTS, keptIndices } from './domain/sparkline/reduce.ts';
export type { Marker, SparklineGeometry } from './domain/sparkline/sparkline.ts';
export { sparkline } from './domain/sparkline/sparkline.ts';
export type { CheckedSparkline, SparklineInput } from './domain/sparkline/validate.ts';
export { validateSparkline } from './domain/sparkline/validate.ts';
export type {
  Ink,
  Inks,
  Palettes,
  SeriesInk,
  Theme,
  ThemeBase,
} from '@paulperigault/tokens/palette';
export {
  derivePalettes,
  inkOn,
  lightDarkTokens,
  paletteTokens,
  readThemeColor,
  seriesInksFromTokens,
  themeBaseFromTokens,
} from '@paulperigault/tokens/palette';
