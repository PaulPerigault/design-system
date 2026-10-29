import { buildAreaModel } from './area-model.ts';
import type { AreaModel } from './area-model.ts';
import { summarizeArea } from './area-summary.ts';
import type { Prepared } from './prepare.ts';
import { prepare } from './prepare.ts';

/** Valide à la frontière puis prépare l'aire (simple ou empilée, 6 séries au plus). */
export const prepareArea = (input: unknown, locale: string, name: string): Prepared<AreaModel> =>
  prepare(input, locale, name, { build: buildAreaModel, summarize: summarizeArea });
