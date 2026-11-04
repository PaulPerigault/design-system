// Lecture seule de l'état GitHub et git. Tous les appels passent par `gh` et `git` injectés.
export const REPO = 'PaulPerigault/design-system';
const LIMIT = '1000';
const SEP = '\t';

const json = (run, args) => JSON.parse(run(args));

export const readIssues = (gh) =>
  json(gh, [
    'issue',
    ...['list', '--state', 'all', '--limit', LIMIT],
    ...['--json', 'number,title,state,body,labels,assignees,milestone,createdAt,closedAt'],
  ]);

const PULL_FIELDS =
  'number,title,state,body,headRefName,author,mergedAt,mergeCommit,closingIssuesReferences';

export const readPulls = (gh) =>
  json(gh, ['pr', ...['list', '--state', 'all', '--limit', LIMIT], '--json', PULL_FIELDS]);

export function readItems(gh, owner, project) {
  const args = ['project', 'item-list', String(project), '--owner', owner];
  return json(gh, [...args, '--limit', LIMIT, '--format', 'json']).items;
}

export const readMilestones = (gh) =>
  json(gh, ['api', `repos/${REPO}/milestones?state=all&per_page=100`]);

/** Table enfant → parent, lue sur les sous-issues des issues `type:chantier`. */
export function readParents(gh, issues) {
  const parents = new Map();
  for (const issue of issues) {
    if (!issue.labels.some((label) => label.name === 'type:chantier')) continue;
    const children = json(gh, ['api', `repos/${REPO}/issues/${issue.number}/sub_issues`]);
    for (const child of children) parents.set(child.number, issue.number);
  }
  return parents;
}

export function readCommits(git, branch = 'main') {
  const out = git(['log', branch, `--format=%H${SEP}%aI${SEP}%s`]);
  return out
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [sha, date, subject] = line.split(SEP);
      return { sha, date, subject };
    });
}

export function readBranches(git) {
  const lines = (out) => out.split('\n').filter(Boolean);
  const local = lines(git(['branch', '--format=%(refname:short)']));
  const heads = lines(git(['ls-remote', '--heads', 'origin']));
  const remote = heads.map((line) => line.split('\t')[1].replace('refs/heads/', ''));
  return { local, remote };
}
