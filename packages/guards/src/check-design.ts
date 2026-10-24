// Contrôle « design » : interdits anti-IA d'AGENTS.md (dégradés, ombres, flou, emoji, palette
// Tailwind, valeurs arbitraires, couleurs brutes, effets rétro, phrases génériques).
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

export const cliOptions = {
  roots: { type: 'string', multiple: true },
  extensions: { type: 'string', multiple: true },
  allow: { type: 'string', multiple: true },
  disable: { type: 'string', multiple: true },
};

/**
 * Lève `GuardUsageError` pour une entrée `allow` mal formée ou un identifiant de règle inconnu.
 * @param {{ allow?: unknown[], disable?: string[] }} options
 */
export function validateOptions({ allow = [], disable = [] }) {
  const entries = allow.filter((entry) => typeof entry !== 'string');
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
const allowedRules = (entry) => (typeof entry === 'string' ? RULE_IDS : (entry.rules ?? RULE_IDS));
const allowedPath = (entry) => (typeof entry === 'string' ? entry : entry.path);

/** Règles actives pour un fichier, après `disable` et `allow`. */
function enabledRules(file, { allow = [], disable = [] }) {
  const matching = allow.filter((entry) => matchesPath(file, allowedPath(entry)));
  const off = new Set([...disable, ...matching.flatMap(allowedRules)]);
  return new Set(RULE_IDS.filter((rule) => !off.has(rule)));
}

/**
 * Analyse pure d'un fichier.
 * @param {string} file chemin POSIX
 * @param {string} text contenu
 * @param {{ allow?: unknown[], disable?: string[] }} options
 * @returns {{ file: string, line: number, rule: string, message: string }[]}
 */
export function checkText(file, text, options = {}) {
  validateOptions(options);
  return analyze(file, text, enabledRules(file, options));
}

/**
 * @param {typeof defaults} options options fusionnées (défauts, fichier, drapeaux)
 * @param {import('./lib/io.ts').GuardIo} io
 * @returns {0 | 1}
 */
export function run(options, io) {
  const merged = { ...defaults, ...options };
  validateOptions(merged);
  const files = listFiles(io, merged.roots, { extensions: merged.extensions });
  const problems = files.flatMap((file) => checkText(file, io.readText(file), merged));
  return report(io, { name, problems, checked: files.length });
}
