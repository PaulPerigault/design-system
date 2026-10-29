export type { Aggregator, Formatter } from './application/ports.ts';
export type { Axis, Dataset, Series } from './domain/dataset.ts';
export { DATASET_SCHEMA, MAX_POINTS, MAX_SERIES } from './domain/dataset.ts';
export { parseIsoDate } from './domain/iso-date.ts';
export {
  MAX_BAR_CATEGORIES,
  checkBarCategories,
  checkSeriesCount,
  checkSharedUnit,
} from './domain/limits.ts';
export { derivePalettes } from './domain/palette/derive.ts';
export { lightDarkTokens, paletteTokens } from './domain/palette/tokens.ts';
export type { Palettes, Theme, ThemeBase } from './domain/palette/types.ts';
export type { Result } from './domain/result.ts';
export { fail, ok } from './domain/result.ts';
export type { DatavizError, ErrorCode } from './errors.ts';
export { createFormatter } from './infrastructure/intl-formatter.ts';
export { parseDataset } from './infrastructure/parse-dataset.ts';
export { themeBaseFromTokens } from './infrastructure/theme-base.ts';
export type { BarRect, BarsInput, Orientation } from './domain/geometry/bars.ts';
export { barRects, rectsPath } from './domain/geometry/bars.ts';
export type { LineGeometry, PathPoint } from './domain/geometry/line-path.ts';
export { linePath } from './domain/geometry/line-path.ts';
export { lttb } from './domain/downsample/lttb.ts';
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
