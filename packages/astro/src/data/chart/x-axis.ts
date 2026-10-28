import type { Axis, Formatter, Result } from '@paulperigault/dataviz';
import {
  fail,
  linearScale,
  niceTicks,
  ok,
  parseIsoDate,
  timeDomain,
  timeScale,
  timeTicks,
} from '@paulperigault/dataviz';
import type { TimeUnit } from '@paulperigault/dataviz';
import { PLOT, PLOT_CENTER, X_TICKS, px } from './frame.ts';

export interface XTick {
  readonly x: number;
  readonly label: string;
}

/** Abscisse en pixels de chaque point du jeu (`xs`) et graduations de l'axe. */
export interface XAxis {
  readonly xs: readonly number[];
  readonly ticks: readonly XTick[];
}

const TICK_FORMATS: Record<TimeUnit, Intl.DateTimeFormatOptions> = {
  day: { day: 'numeric', month: 'short' },
  week: { day: 'numeric', month: 'short' },
  month: { month: 'short', year: 'numeric' },
  year: { year: 'numeric' },
};

const ascending = (values: readonly number[]): boolean =>
  values.every((value, index) => index === 0 || value >= (values[index - 1] ?? value));

function categories(labels: readonly string[]): Result<XAxis> {
  const last = labels.length - 1;
  const xs = labels.map((_, i) =>
    last === 0 ? PLOT_CENTER : PLOT.left + (i * (PLOT.right - PLOT.left)) / last,
  );
  const every = Math.ceil(labels.length / X_TICKS);
  const ticks = labels.flatMap((label, i) =>
    i % every === 0 ? [{ x: px(xs[i] ?? 0), label }] : [],
  );
  return ok({ xs, ticks });
}

function numbers(values: readonly number[], fmt: Formatter): Result<XAxis> {
  if (!ascending(values))
    return fail('geometry.bad-input', 'Abscisses non croissantes.', 'x.values');
  const nice = niceTicks(Math.min(...values), Math.max(...values), X_TICKS);
  if (!nice.ok) return nice;
  const scale = linearScale(nice.value.domain, [PLOT.left, PLOT.right]);
  if (!scale.ok) return scale;
  const ticks = nice.value.values.map((v) => ({ x: px(scale.value.map(v)), label: fmt.number(v) }));
  return ok({ xs: values.map(scale.value.map), ticks });
}

function times(values: readonly string[], fmt: Formatter): Result<XAxis> {
  const domain = timeDomain(values);
  if (!domain.ok) return domain;
  const scale = timeScale(domain.value, [PLOT.left, PLOT.right]);
  const marks = timeTicks(domain.value[0], domain.value[1], X_TICKS);
  if (!scale.ok) return scale;
  if (!marks.ok) return marks;
  const instants = values.flatMap((text) => {
    const parsed = parseIsoDate(text);
    return parsed.ok ? [parsed.value] : [];
  });
  if (!ascending(instants)) return fail('geometry.bad-input', 'Dates non croissantes.', 'x.values');
  const label = new Intl.DateTimeFormat(fmt.locale, {
    ...TICK_FORMATS[marks.value.unit],
    timeZone: 'UTC',
  });
  const ticks = marks.value.values.map((t) => ({
    x: px(scale.value.map(t)),
    label: label.format(t),
  }));
  return ok({ xs: instants.map(scale.value.map), ticks });
}

/** Positions et graduations de l'axe horizontal, selon son genre (catégories, temps, nombres). */
export function buildXAxis(axis: Axis, fmt: Formatter): Result<XAxis> {
  if (axis.kind === 'category') return categories(axis.values);
  return axis.kind === 'number' ? numbers(axis.values, fmt) : times(axis.values, fmt);
}
