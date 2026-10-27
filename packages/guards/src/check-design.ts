// Contrôle « design » : interdits anti-IA d'AGENTS.md (dégradés, ombres, flou, emoji, palette
// Tailwind, valeurs arbitraires, couleurs brutes, effets rétro, phrases génériques).
import type { CliOptions } from './lib/check.ts';
import type { GuardIo } from './lib/io.ts';
import { listFiles } from './lib/files.ts';
import { isRecord, isStrings, listOption } from './lib/options.ts';
import type { Options } from './lib/options.ts';
import { matchesPath } from './lib/paths.ts';
import { GuardUsageError, report } from './lib/report.ts';
import { analyze, RULE_IDS } from './design/rules.ts';

export const name = 'design';

export const defaults = {
  roots: ['src'],
  extensions: ['.astro', '.css', '.html', '.md', '.mdx', '.jsx', '.tsx'],
  allow: [],
  disable: [],
};

export const cliOptions: CliOptions = {
  roots: { type: 'string' as const, multiple: true },
  extensions: { type: 'string' as const, multiple: true },
  allow: { type: 'string' as const, multiple: true },
  disable: { type: 'string' as const, multiple: true },
};

interface DesignAllowEntry {
  path: string;
  rules?: string[];
}

export interface DesignSettings {
  allow: (string | DesignAllowEntry)[];
  disable: string[];
}

const listError = (key: string): GuardUsageError =>
  new GuardUsageError(`design : « ${key} » doit être une liste`);

function allowEntry(entry: unknown): string | DesignAllowEntry {
  if (typeof entry === 'string') return entry;
  if (!isRecord(entry) || typeof entry.path !== 'string') {
    throw new GuardUsageError('design : chaque entrée « allow » objet doit avoir un « path »');
  }
  if (entry.rules === undefined) return { path: entry.path };
  if (!isStrings(entry.rules)) throw listError('allow[].rules');
  return { path: entry.path, rules: entry.rules };
}

function disabledRules(value: unknown): string[] {
  if (value === undefined) return [];
  if (isStrings(value)) return value;
  throw listError('disable');
}

function allowEntries(value: unknown): (string | DesignAllowEntry)[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value.map(allowEntry);
  throw listError('allow');
}

/**
 * Valide `allow` et `disable` et rend leur forme typée. Lève `GuardUsageError` pour une entrée
 * `allow` mal formée ou un identifiant de règle inconnu.
 */
export function validateOptions({ allow, disable }: Options): DesignSettings {
  const settings = { allow: allowEntries(allow), disable: disabledRules(disable) };
  const entryRules = settings.allow.flatMap((entry) =>
    typeof entry === 'string' ? [] : (entry.rules ?? []),
  );
  const unknown = [...settings.disable, ...entryRules].filter((id) => !RULE_IDS.includes(id));
  if (unknown.length > 0) {
    throw new GuardUsageError(
      `design : règle inconnue ${unknown.join(', ')} (connues : ${RULE_IDS.join(', ')})`,
    );
  }
  return settings;
}

/** Règles coupées par une entrée `allow` : toutes pour une chaîne, sinon celles citées. */
const allowedRules = (entry: string | DesignAllowEntry): readonly string[] =>
  typeof entry === 'string' ? RULE_IDS : (entry.rules ?? RULE_IDS);
const allowedPath = (entry: string | DesignAllowEntry): string =>
  typeof entry === 'string' ? entry : entry.path;

/** Règles actives pour un fichier, après `disable` et `allow`. */
function enabledRules(file: string, { allow, disable }: DesignSettings) {
  const matching = allow.filter((entry) => matchesPath(file, allowedPath(entry)));
  const off = new Set<string>([...disable, ...matching.flatMap(allowedRules)]);
  return new Set(RULE_IDS.filter((rule) => !off.has(rule)));
}

type DesignProblem = { file: string; line: number; rule: string; message: string };

function analyzeFile(file: string, text: string, settings: DesignSettings): DesignProblem[] {
  return analyze(file, text, enabledRules(file, settings));
}

export function checkText(file: string, text: string, options: Options = {}): DesignProblem[] {
  return analyzeFile(file, text, validateOptions(options));
}

export function run(options: Options, io: GuardIo): 0 | 1 {
  const settings = validateOptions(options);
  const roots = listOption(options, 'roots', defaults.roots);
  const extensions = listOption(options, 'extensions', defaults.extensions);
  const files = listFiles(io, roots, { extensions });
  const problems = files.flatMap((file) => analyzeFile(file, io.readText(file), settings));
  return report(io, { name, problems, checked: files.length });
}
