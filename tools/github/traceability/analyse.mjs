// Assemble les règles pures sur les données lues. Aucune E/S.
import { checkIssue, checkMilestones, classifyBranches, field } from './issue-rules.mjs';
import { catchUpRefs, classifyCommits, classifyPulls } from './pull-rules.mjs';

export const CUTOFF = 37; // PR de la bascule vers `main` seule : avant elle, pas de processus
export const CATCH_UP_ISSUES = { first: 42, last: 66 };

const inRange = (n) => n >= CATCH_UP_ISSUES.first && n <= CATCH_UP_ISSUES.last;

function indexItems(items) {
  const byKind = (kind) =>
    new Map(items.filter((it) => it.content.type === kind).map((it) => [it.content.number, it]));
  return { issues: byKind('Issue'), pulls: byKind('PullRequest') };
}

function issueRows(data, items) {
  return data.issues.map((issue) => {
    const item = items.issues.get(issue.number);
    return {
      number: issue.number,
      state: issue.state,
      status: item ? (field(item, 'status') ?? 'aucun') : 'hors-project',
      problems: checkIssue(issue, { item, parent: data.parents.get(issue.number) }),
    };
  });
}

/** @returns {{pulls, pullProject, commits, issues, milestones, branches, unreadable}} */
export function analyse(data) {
  const texts = [data.catchUp, ...data.issues.filter((i) => inRange(i.number)).map((i) => i.body)];
  const refs = catchUpRefs(texts.map((text) => text ?? ''));
  const items = indexItems(data.items);
  const cutoffSha = data.pulls.find((pull) => pull.number === CUTOFF)?.mergeCommit?.oid;
  const live = data.pulls.filter((pull) => pull.state !== 'CLOSED');
  return {
    pulls: classifyPulls(data.pulls, { cutoff: CUTOFF, refs }),
    pullProject: live.map((pull) => ({
      number: pull.number,
      problems: items.pulls.has(pull.number) ? [] : ['hors-project'],
    })),
    commits: classifyCommits(data.commits, data.pulls, { cutoffSha, refs }),
    issues: issueRows(data, items),
    milestones: checkMilestones(data.milestones),
    branches: classifyBranches(data.branches, data.pulls),
    unreadable: data.unreadable,
  };
}
