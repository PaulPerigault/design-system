// Contrôle « design » : interdits anti-IA d'AGENTS.md (dégradés, ombres, flou, emoji, palette
// Tailwind, valeurs arbitraires, couleurs brutes, effets rétro, phrases génériques).
import type { GuardIo } from './lib/io.ts';
import { listFiles } from './lib/files.ts';
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

export const cliOptions: Record<string, { type: 'string' | 'boolean'; multiple?: boolean }> = {
  roots: { type: 'string' as const, multiple: true },
  extensions: { type: 'string' as const, multiple: true },
  allow: { type: 'string' as const, multiple: true },
  disable: { type: 'string' as const, multiple: true },
};

interface DesignAllowEntry {
  path: string;
  rules?: string[];
}

interface DesignOptions {
  allow?: (string | DesignAllowEntry)[];
  disable?: string[];
}

/**
 * Lève `GuardUsageError` pour une entrée `allow` mal formée ou un identifiant de règle inconnu.
 */
export function validateOptions({ allow = [], disable = [] }: DesignOptions) {
  const entries = allow.filter((entry) => typeof entry !== 'string') as DesignAllowEntry[];
  if (entries.some((entry) => typeof entry?.path !== 'string')) {
    throw new GuardUsageError('design : chaque entrée « allow » objet doit avoir un « path »');
  }
  const cited = [...disable, ...entries.flatMap((entry) => entry.rules ?? [])];
  const unknown = cited.filter((id) => !RULE_IDS.includes(id));
  if (unknown.length > 0) {
    throw new GuardUsageError(
      `design : règle inconnue ${unknown.join(', ')} (connues : ${RULE_IDS.join(', ')})`,
    );
  }
}

/** Règles coupées par une entrée `allow` : toutes pour une chaîne, sinon celles citées. */
const allowedRules = (entry: string | DesignAllowEntry): readonly string[] =>
  typeof entry === 'string' ? RULE_IDS : (entry.rules ?? RULE_IDS);
const allowedPath = (entry: string | DesignAllowEntry): string =>
  typeof entry === 'string' ? entry : entry.path;

/** Règles actives pour un fichier, après `disable` et `allow`. */
function enabledRules(file: string, { allow = [], disable = [] }: DesignOptions) {
  const matching = allow.filter((entry) => matchesPath(file, allowedPath(entry)));
  const off = new Set<string>([...disable, ...matching.flatMap(allowedRules)]);
  return new Set(RULE_IDS.filter((rule) => !off.has(rule)));
}

export function checkText(
  file: string,
  text: string,
  options: DesignOptions = {},
): { file: string; line: number; rule: string; message: string }[] {
  validateOptions(options);
  return analyze(file, text, enabledRules(file, options));
}

export function run(options: DesignOptions & typeof defaults, io: GuardIo): 0 | 1 {
  const merged = { ...defaults, ...options } as DesignOptions & typeof defaults;
  validateOptions(merged);
  const files = listFiles(io, merged.roots as string[], { extensions: merged.extensions as string[] }) as string[];
  const problems = files.flatMap((file) => checkText(file, io.readText(file), merged));
  return report(io, { name, problems, checked: files.length });
}
