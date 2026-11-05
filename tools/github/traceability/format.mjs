// Mise en forme du rapport : comptes par statut et échantillon d'anomalies. Aucune E/S.
const SAMPLE = 8;
const PULL_OK = ['ok', 'rattrapage', 'exempt', 'fermee-sans-fusion'];
const BRANCH_OK = ['principale', 'exempt', 'avec-pr'];

export function countBy(rows, pick) {
  const counts = new Map();
  for (const row of rows) {
    for (const key of [pick(row)].flat()) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]);
}

const render = (counts) => counts.map(([key, n]) => `${key} ${n}`).join(' · ') || 'aucun';

function section(title, rows, spec, all) {
  const keys = (row) => [spec.pick(row)].flat();
  const lines = [`## ${title} (${rows.length})`, render(countBy(rows, spec.pick))];
  const bad = rows.filter((row) => !keys(row).every((key) => spec.good.includes(key)));
  for (const row of all ? bad : bad.slice(0, SAMPLE)) lines.push(`  - ${spec.show(row)}`);
  if (!all && bad.length > SAMPLE) lines.push(`  … ${bad.length - SAMPLE} autres (option --all)`);
  const waived = countBy(rows, (row) => row.exemptions ?? []);
  if (waived.length > 0) lines.push(`exemptions : ${render(waived)}`);
  return lines;
}

const status = (r) => r.status;
const problems = (r) => r.problems;

const SPECS = [
  [
    'PR',
    'pulls',
    { pick: status, good: PULL_OK, show: (r) => `#${r.number} ${r.status} ${r.title}` },
  ],
  ['PR hors Project', 'pullProject', { pick: problems, good: [], show: (r) => `#${r.number}` }],
  [
    'Commits',
    'commits',
    { pick: status, good: PULL_OK, show: (r) => `${r.sha} ${r.status} ${r.subject}` },
  ],
  [
    'Issues',
    'issues',
    { pick: problems, good: [], show: (r) => `#${r.number} ${r.problems.join(', ')}` },
  ],
  [
    'Jalons',
    'milestones',
    { pick: problems, good: [], show: (r) => `${r.title} : ${r.open} ouvertes` },
  ],
  [
    'Branches',
    'branches',
    { pick: status, good: BRANCH_OK, show: (r) => `${r.where} ${r.name} (${r.status})` },
  ],
];

export function formatReport(report, { all = false } = {}) {
  const lines = ['Audit de traçabilité (lecture seule, jamais bloquant)', ''];
  for (const [title, key, spec] of SPECS) lines.push(...section(title, report[key], spec, all));
  for (const note of report.unreadable) lines.push(`[À VÉRIFIER] ${note}`);
  return lines.join('\n');
}
