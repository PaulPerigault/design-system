// Garde-fou images : balisage brut hors `allow`, métadonnées EXIF/GPS/XMP (vie privée),
// budget de poids par fichier. Aucune dépendance : les binaires sont lus à la main.
import { listFiles } from './lib/files.mjs';
import { normalizePath } from './lib/paths.mjs';
import { report } from './lib/report.mjs';
import { BUDGET_EXTENSIONS, budgetProblems, budgetSettings } from './images/budget.mjs';
import { MARKUP_EXTENSIONS, markupProblems } from './images/markup.mjs';
import { METADATA_EXTENSIONS, metadataProblems } from './images/metadata.mjs';

const DEFAULT_MAX_KB = 500;
const EXTENSIONS = [...new Set([...MARKUP_EXTENSIONS, ...BUDGET_EXTENSIONS])];

export const name = 'images';

export const defaults = {
  roots: ['src', 'public'],
  allow: ['src/media'],
  maxKb: DEFAULT_MAX_KB,
  budgets: [],
};

/** Options `node:util` `parseArgs` ; `budgets` reçoit du JSON en ligne de commande. */
export const cliOptions = {
  allow: { type: 'string', multiple: true },
  maxKb: { type: 'string' },
  budgets: { type: 'string' },
};

/**
 * @param {Record<string, unknown>} options options fusionnées par la CLI
 */
function settings(options) {
  const roots = options.roots?.length > 0 ? options.roots : defaults.roots;
  const allow = [options.allow ?? defaults.allow].flat().map(normalizePath);
  const budget = budgetSettings({
    maxKb: options.maxKb ?? defaults.maxKb,
    budgets: options.budgets ?? defaults.budgets,
  });
  return { roots, allow, budget };
}

/** @param {string[]} files @param {string[]} extensions */
const select = (files, extensions) =>
  files.filter((file) => extensions.some((ext) => file.toLowerCase().endsWith(ext)));

/**
 * @param {Record<string, unknown>} options `roots`, `allow`, `maxKb`, `budgets`
 * @param {import('./lib/io.mjs').GuardIo} io
 * @returns {0 | 1}
 */
export function run(options, io) {
  const { roots, allow, budget } = settings(options ?? {});
  const files = listFiles(io, roots, { extensions: EXTENSIONS });
  const problems = [
    ...markupProblems(io, select(files, MARKUP_EXTENSIONS), allow),
    ...metadataProblems(io, select(files, METADATA_EXTENSIONS)),
    ...budgetProblems(io, select(files, BUDGET_EXTENSIONS), budget),
  ];
  return report(io, { name, problems, checked: files.length });
}
