import type { Dataset } from '@paulperigault/dataviz';
import data from './chart-data.json';

/** Jeux d'exemple des pages LineChart, BarChart, AreaChart et GaugeChart : valeurs fictives, sans nom propre. */
export const monthlyVisits = data.monthlyVisits as Dataset;
export const visitsBySection = data.visitsBySection as Dataset;
export const visitsWithGaps = data.visitsWithGaps as Dataset;
export const bySection = data.bySection as Dataset;
export const bySectionAndYear = data.bySectionAndYear as Dataset;
export const gapToTarget = data.gapToTarget as Dataset;
export const longLabels = data.longLabels as Dataset;
export const trafficBySource = data.trafficBySource as Dataset;
export const trafficTwoSources = data.trafficTwoSources as Dataset;
export const trafficWithGaps = data.trafficWithGaps as Dataset;
export const trafficSixSources = data.trafficSixSources as Dataset;
export const trafficTotalArea = data.trafficTotalArea as Dataset;
interface GaugeExample {
  value: number;
  min?: number;
  max?: number;
  unit: string;
  label: string;
  shape?: 'half' | 'full';
  zones: { label: string; to?: number; tone?: 'good' | 'warning' | 'bad' | 'info' }[];
}
export const gauges = data.gauges as Record<
  'fill' | 'fullCircle' | 'outOfRange' | 'named',
  GaugeExample
>;
