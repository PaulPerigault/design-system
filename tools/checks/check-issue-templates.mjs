// Cohérence des formulaires d'issue : clés requises, labels présents dans labels.json, options de
// « Paquet » alignées sur les labels `pkg:`, identifiants de champs uniques, issues vierges refusées.
// Lecture ligne à ligne : aucune bibliothèque YAML n'est une dépendance directe du dépôt.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path/posix';

const DIR = '.github/ISSUE_TEMPLATE';
const LABELS_FILE = '.github/labels.json';
const REQUIRED_KEYS = ['name', 'description', 'title', 'labels', 'assignees', 'projects', 'body'];
const LIST_LINE = (key) => new RegExp(`^${key}:\\s*\\[(.*)\\]\\s*$`, 'm');
const PKG_PREFIX = 'pkg:';

const items = (text, key) =>
  (LIST_LINE(key).exec(text)?.[1] ?? '')
    .split(',')
    .map((item) => item.trim().replace(/^'|'$/g, ''))
    .filter(Boolean);

const duplicates = (values) => values.filter((value, index) => values.indexOf(value) !== index);

function packageOptions(text) {
  const block = /id: paquet\n[\s\S]*?options: \[(.*)\]/.exec(text);
  return block ? block[1].split(',').map((item) => item.trim()) : [];
}

/** @returns {string[]} problèmes d'un formulaire d'issue (`text` = contenu du fichier) */
export function templateProblems(text, labelNames) {
  const problems = REQUIRED_KEYS.filter((key) => !new RegExp(`^${key}:`, 'm').test(text)).map(
    (key) => `clé « ${key} » manquante`,
  );
  for (const label of items(text, 'labels')) {
    if (!labelNames.has(label)) problems.push(`label inconnu : ${label}`);
  }
  const ids = [...text.matchAll(/^ {4}id: (\S+)$/gm)].map((match) => match[1]);
  for (const id of new Set(duplicates(ids))) problems.push(`identifiant en double : ${id}`);
  for (const option of packageOptions(text)) {
    if (!labelNames.has(`${PKG_PREFIX}${option}`)) problems.push(`paquet sans label : ${option}`);
  }
  return problems;
}

/** @returns {string[]} problèmes de `config.yml` */
export function configProblems(text) {
  return /^blank_issues_enabled: false$/m.test(text)
    ? []
    : ['blank_issues_enabled doit valoir false'];
}

if (import.meta.main) {
  const labelNames = new Set(JSON.parse(readFileSync(LABELS_FILE, 'utf8')).map(({ name }) => name));
  const files = readdirSync(DIR).filter((name) => name.endsWith('.yml'));
  const failures = files.flatMap((name) => {
    const text = readFileSync(join(DIR, name), 'utf8');
    const problems =
      name === 'config.yml' ? configProblems(text) : templateProblems(text, labelNames);
    return problems.map((problem) => `${DIR}/${name} : ${problem}`);
  });
  for (const failure of failures) console.error(failure);
  if (failures.length > 0) process.exit(1);
  console.log('check-issue-templates: OK');
}
