import { checkBarCategories } from '@paulperigault/dataviz';
import type { BarModel, BarOptions } from './bar-model.ts';
import { buildBarModel } from './bar-model.ts';
import { summarizeBarChart } from './bar-summary.ts';
import type { Prepared } from './prepare.ts';
import { prepare } from './prepare.ts';

/** Valide (40 catégories au plus, `bar.too-many-categories`) puis prépare les barres. */
export const prepareBar = (
  input: unknown,
  locale: string,
  name: string,
  options: BarOptions,
): Prepared<BarModel> =>
  prepare(input, locale, name, {
    check: checkBarCategories,
    build: (dataset, fmt) => buildBarModel(dataset, fmt, options),
    summarize: summarizeBarChart,
  });
