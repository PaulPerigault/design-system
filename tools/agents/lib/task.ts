// Lecture d'un fichier de tâche (`tasks/<id>-<slug>.md`) : front matter YAML restreint (scalaires,
// listes en ligne `[a, b]`, listes en bloc `- x`) puis énoncé Markdown. Aucune dépendance.
import type { Task } from './types.ts';

const FRONT_MATTER = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
const KEY_LINE = /^([a-z_]+):\s*(.*?)\s*(?:#.*)?$/;
const ITEM_LINE = /^\s+-\s+(.+?)\s*$/;
const ENGINES = ['kiro', 'claude'];
const TIERS = ['mech', 'light', 'eco', 'std', 'hard', 'xreview'];
const REQUIRED = ['id', 'title', 'engine', 'agent', 'tier', 'files', 'acceptance'];

export type FrontValue = string | string[];
export type FrontMatter = Record<string, FrontValue>;

const scalar = (text: string): FrontValue => {
  if (text.startsWith('[') && text.endsWith(']')) {
    return text
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  // Guillemets retirés seulement s'ils encadrent toute la valeur : une commande comme
  // `node -e "…"` garde les siens (bug constaté sur T2.09, quatre paliers échoués à tort).
  const quoted = /^(["'])(.*)\1$/.exec(text);
  return quoted?.[2] ?? text;
};

const listItem = (line: string): string | undefined => {
  const item = ITEM_LINE.exec(line)?.[1];
  return item === undefined ? undefined : String(scalar(item));
};

const keyValue = (line: string): [string, string] | null => {
  const [, key, value] = KEY_LINE.exec(line) ?? [];
  return key === undefined || value === undefined ? null : [key, value];
};

/** Front matter → objet ; une clé sans valeur suivie de `- x` devient une liste. */
export function parseFrontMatter(yaml: string): FrontMatter {
  const data: FrontMatter = {};
  let list: string[] | null = null;
  for (const line of yaml.split('\n')) {
    const item = listItem(line);
    if (item !== undefined && list) {
      list.push(item);
      continue;
    }
    const entry = keyValue(line);
    if (!entry) continue;
    list = entry[1] === '' ? [] : null;
    data[entry[0]] = list ?? scalar(entry[1]);
  }
  return data;
}

const isEmpty = (value: FrontValue | undefined): boolean =>
  value === undefined || value.length === 0;
const text = (value: FrontValue | undefined): string => (typeof value === 'string' ? value : '');
const items = (value: FrontValue | undefined): string[] =>
  Array.isArray(value) ? value : value === undefined || value === '' ? [] : [value];

/** Problèmes de la tâche (vide si elle est exécutable). */
export function taskProblems(task: FrontMatter): string[] {
  const problems = REQUIRED.filter((key) => isEmpty(task[key])).map(
    (key) => `champ « ${key} » manquant`,
  );
  const { engine, tier, files } = task;
  if (engine && !ENGINES.includes(text(engine))) problems.push(`engine inconnu : ${text(engine)}`);
  if (tier && !TIERS.includes(text(tier))) problems.push(`tier inconnu : ${text(tier)}`);
  if (Array.isArray(files) && files.some((file) => file.startsWith('/') || file.includes('..'))) {
    problems.push('files : chemins relatifs au dépôt uniquement');
  }
  return problems;
}

/** `content` : contenu du fichier de tâche. */
export function parseTask(content: string): Task {
  const match = FRONT_MATTER.exec(content.replace(/\r\n/g, '\n'));
  if (!match) throw new Error('Tâche sans front matter (--- … ---).');
  const data = parseFrontMatter(match[1] ?? '');
  const merged: FrontMatter = { effort: 'medium', depends_on: [], ...data };
  const problems = taskProblems(merged);
  if (problems.length > 0)
    throw new Error(`Tâche ${text(merged.id) || '?'} invalide : ${problems.join(' ; ')}`);
  return {
    id: text(merged.id),
    title: text(merged.title),
    engine: text(merged.engine),
    agent: text(merged.agent),
    tier: text(merged.tier),
    effort: text(merged.effort),
    files: items(merged.files),
    acceptance: items(merged.acceptance),
    depends_on: items(merged.depends_on),
    body: (match[2] ?? '').trim(),
  };
}
