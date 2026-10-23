// Lecture d'un fichier de tâche (`tasks/<id>-<slug>.md`) : front matter YAML restreint (scalaires,
// listes en ligne `[a, b]`, listes en bloc `- x`) puis énoncé Markdown. Aucune dépendance.

const FRONT_MATTER = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
const KEY_LINE = /^([a-z_]+):\s*(.*?)\s*(?:#.*)?$/;
const ITEM_LINE = /^\s+-\s+(.+?)\s*$/;
const ENGINES = ['kiro', 'claude'];
const TIERS = ['mech', 'light', 'std', 'hard', 'xreview'];
const REQUIRED = ['id', 'title', 'engine', 'agent', 'tier', 'files', 'acceptance'];

const scalar = (text) => {
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
  return quoted ? quoted[2] : text;
};

/** Front matter → objet ; une clé sans valeur suivie de `- x` devient une liste. */
export function parseFrontMatter(yaml) {
  const data = {};
  let listKey = null;
  for (const line of yaml.split('\n')) {
    const item = ITEM_LINE.exec(line);
    if (item && listKey) {
      data[listKey].push(scalar(item[1]));
      continue;
    }
    const entry = KEY_LINE.exec(line);
    if (!entry) continue;
    const [, key, value] = entry;
    listKey = value === '' ? key : null;
    data[key] = value === '' ? [] : scalar(value);
  }
  return data;
}

/** @returns {string[]} problèmes de la tâche (vide si elle est exécutable) */
export function taskProblems(task) {
  const missing = REQUIRED.filter((key) => task[key] === undefined || task[key].length === 0);
  const problems = missing.map((key) => `champ « ${key} » manquant`);
  if (task.engine && !ENGINES.includes(task.engine))
    problems.push(`engine inconnu : ${task.engine}`);
  if (task.tier && !TIERS.includes(task.tier)) problems.push(`tier inconnu : ${task.tier}`);
  if (
    Array.isArray(task.files) &&
    task.files.some((file) => file.startsWith('/') || file.includes('..'))
  ) {
    problems.push('files : chemins relatifs au dépôt uniquement');
  }
  return problems;
}

/**
 * @param {string} text contenu du fichier de tâche
 * @returns {{ id: string, title: string, engine: string, agent: string, tier: string,
 *   effort: string, files: string[], acceptance: string[], depends_on: string[], body: string }}
 */
export function parseTask(text) {
  const match = FRONT_MATTER.exec(text.replace(/\r\n/g, '\n'));
  if (!match) throw new Error('Tâche sans front matter (--- … ---).');
  const data = parseFrontMatter(match[1]);
  const task = { effort: 'medium', depends_on: [], ...data, body: match[2].trim() };
  const problems = taskProblems(task);
  if (problems.length > 0)
    throw new Error(`Tâche ${task.id ?? '?'} invalide : ${problems.join(' ; ')}`);
  return task;
}
