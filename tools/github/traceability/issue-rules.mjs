// Calcul pur : conformité des issues, des jalons, des branches et du Project. Aucun appel réseau.
const REQUIRED = [
  ['type:', 'label-type'],
  ['pkg:', 'label-pkg'],
  ['taille:', 'label-taille'],
  ['prio:', 'label-prio'],
];
const PARENT_MENTION = /Issue parente[\s\S]{0,60}#\d+/i;

const plain = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const letters = (text) => plain(text).replace(/[^a-z]/g, '');

/** Lit un champ du Project sans dépendre des accents ni de la casse (gh abîme l'initiale « É »). */
export function field(item, name) {
  const wanted = letters(name);
  const exact = Object.keys(item).find((key) => letters(key) === wanted);
  const damaged = Object.keys(item).find((key) => letters(key) === wanted.slice(1));
  const key = exact ?? damaged;
  return key ? item[key] : undefined;
}

function labelProblems(issue) {
  const names = issue.labels.map((label) => label.name);
  return REQUIRED.filter(([prefix]) => !names.some((n) => n.startsWith(prefix))).map(([, c]) => c);
}

function projectProblems(item) {
  if (!item) return ['hors-project'];
  const problems = [];
  if (!field(item, 'début')) problems.push('debut-vide');
  if (!field(item, 'échéance')) problems.push('echeance-vide');
  if (!field(item, 'status')) problems.push('status-vide');
  return problems;
}

/** Anomalies d'une issue, sous forme de codes courts. */
export function checkIssue(issue, { item, parent }) {
  const problems = labelProblems(issue);
  if (issue.assignees.length === 0) problems.push('non-assignee');
  if (!issue.milestone) problems.push('sans-jalon');
  problems.push(...projectProblems(item));
  if (!parent && PARENT_MENTION.test(issue.body ?? '')) problems.push('parent-non-lie');
  return problems;
}

export function checkMilestones(milestones) {
  return milestones.map((m) => ({
    title: m.title,
    open: m.open_issues,
    closed: m.closed_issues,
    problems: m.due_on ? [] : ['echeance-vide'],
  }));
}

const STALE = { MERGED: 'fusionnee-non-supprimee', CLOSED: 'fermee-non-supprimee' };
const TEMPORARY = [/^release-please--/, /^dependabot\//];

/** Branche distante ou locale : liée à une PR (ouverte, fusionnée, fermée), exemptée, ou orpheline. */
export function classifyBranches({ local, remote }, pulls) {
  const byHead = new Map(pulls.map((pull) => [pull.headRefName, pull]));
  const one = (name, where) => {
    const pull = byHead.get(name);
    if (name === 'main') return { name, where, status: 'principale' };
    if (TEMPORARY.some((re) => re.test(name))) return { name, where, status: 'exempt' };
    if (!pull) return { name, where, status: 'orpheline' };
    const stale = STALE[pull.state] ?? 'avec-pr';
    return { name, where, status: stale, pull: pull.number };
  };
  return [...local.map((n) => one(n, 'local')), ...remote.map((n) => one(n, 'distante'))];
}
