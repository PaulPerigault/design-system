// Audit de traçabilité (lecture seule) : PR, commits, issues, Project, branches, jalons.
// AFFICHE sans jamais échouer (code de sortie 0). `--all` liste toutes les anomalies, `--json` le brut.
// Exemptions : PR de release-please et de Dependabot (aucune issue par conception) ; label prio:
// des issues type:rattrapage (décision Q24, issue #290), affichées à part et jamais comptées.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { analyse } from './traceability/analyse.mjs';
import * as read from './traceability/fetch.mjs';
import { formatReport } from './traceability/format.mjs';

const OWNER = 'PaulPerigault';
const PROJECT = 13;
const CATCH_UP = 'docs/history/catch-up.md';
const EXEC = { encoding: 'utf8', maxBuffer: 2 ** 28 };

export const ghRun = (args) => execFileSync('gh', args, EXEC);
export const gitRun = (args) => execFileSync('git', args, EXEC);

function attempt(label, unreadable, fn, fallback) {
  try {
    return fn();
  } catch (error) {
    unreadable.push(`${label} illisible : ${String(error.message).split('\n')[0]}`);
    return fallback;
  }
}

/** Lit tout l'état ; une lecture qui échoue est notée dans `unreadable`, jamais fatale. */
export function load({ gh, git, readText }) {
  const unreadable = [];
  const get = (label, fn, fallback) => attempt(label, unreadable, fn, fallback);
  const issues = get('issues', () => read.readIssues(gh), []);
  return {
    issues,
    pulls: get('PR', () => read.readPulls(gh), []),
    items: get('Project 13', () => read.readItems(gh, OWNER, PROJECT), []),
    parents: get('sous-issues', () => read.readParents(gh, issues), new Map()),
    commits: get('commits', () => read.readCommits(git), []),
    branches: get('branches', () => read.readBranches(git), { local: [], remote: [] }),
    milestones: get('jalons', () => read.readMilestones(gh), []),
    catchUp: get(CATCH_UP, () => readText(CATCH_UP), ''),
    unreadable,
  };
}

if (import.meta.main) {
  const data = load({ gh: ghRun, git: gitRun, readText: (file) => readFileSync(file, 'utf8') });
  const report = analyse(data);
  const all = process.argv.includes('--all');
  console.log(
    process.argv.includes('--json') ? JSON.stringify(report) : formatReport(report, { all }),
  );
}
