// Garde-fou images : balisage brut hors `allow`, métadonnées EXIF/GPS/XMP (vie privée),
// budget de poids par fichier. Aucune dépendance : les binaires sont lus à la main.
import type { CliOptions } from './lib/check.ts';
import type { GuardIo } from './lib/io.ts';
import { listFiles } from './lib/files.ts';
import { listOption, nonEmptyListOption } from './lib/options.ts';
import type { Options } from './lib/options.ts';
import { normalizePath } from './lib/paths.ts';
import { report } from './lib/report.ts';
import { BUDGET_EXTENSIONS, budgetProblems, budgetSettings } from './images/budget.ts';
import { MARKUP_EXTENSIONS, markupProblems } from './images/markup.ts';
import { METADATA_EXTENSIONS, metadataProblems } from './images/metadata.ts';

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
export const cliOptions: CliOptions = {
  allow: { type: 'string' as const, multiple: true },
  maxKb: { type: 'string' as const },
  budgets: { type: 'string' as const },
};

/** `allow` : une liste, ou une chaîne seule ; absent, il vaut `defaults.allow`. */
function allowedPaths(options: Options): string[] {
  const { allow } = options;
  const list = typeof allow === 'string' ? [allow] : listOption(options, 'allow', defaults.allow);
  return list.map(normalizePath);
}

function settings(options: Options) {
  const roots = nonEmptyListOption(options, 'roots', defaults.roots);
  const allow = allowedPaths(options);
  const budget = budgetSettings({
    maxKb: options.maxKb ?? defaults.maxKb,
    budgets: options.budgets ?? defaults.budgets,
  });
  return { roots, allow, budget };
}

const select = (files: string[], extensions: string[]): string[] =>
  files.filter((file) => extensions.some((ext) => file.toLowerCase().endsWith(ext)));

export function run(options: Options, io: GuardIo): 0 | 1 {
  const { roots, allow, budget } = settings(options);
  const files = listFiles(io, roots, { extensions: EXTENSIONS });
  const problems = [
    ...markupProblems(io, select(files, MARKUP_EXTENSIONS), allow),
    ...metadataProblems(io, select(files, METADATA_EXTENSIONS)),
    ...budgetProblems(io, select(files, BUDGET_EXTENSIONS), budget),
  ];
  return report(io, { name, problems, checked: files.length });
}
