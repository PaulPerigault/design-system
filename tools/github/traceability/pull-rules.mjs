// Calcul pur : PR et commits de `main` rattachés à une issue. Aucun appel réseau.
const KEYWORD = /\b(?:Closes|Refs)\s+#(\d+)/gi;
const SUFFIX = /\(#(\d+)\)$/;
const SHORT = 7;

export const isExempt = (pull) =>
  pull.headRefName.startsWith('release-please--') ||
  pull.headRefName.startsWith('dependabot/') ||
  /dependabot/i.test(pull.author?.login ?? '');

/** Numéros d'issues liés : lien GitHub (closingIssuesReferences) ou ligne Closes/Refs du corps. */
export function linkedIssues(pull) {
  const numbers = new Set((pull.closingIssuesReferences ?? []).map((ref) => ref.number));
  for (const match of (pull.body ?? '').matchAll(KEYWORD)) numbers.add(Number(match[1]));
  return [...numbers];
}

/** Numéros de PR et SHA courts cités par le texte du rattrapage (catch-up.md, issues #42 à #66). */
export function catchUpRefs(texts) {
  const numbers = new Set();
  const shas = new Set();
  for (const text of texts) {
    for (const match of text.matchAll(/#(\d+)/g)) numbers.add(Number(match[1]));
    for (const match of text.matchAll(/\b[0-9a-f]{7}\b/g)) shas.add(match[0]);
  }
  return { numbers, shas };
}

/** Classe chaque PR : ok, sans-issue, exempt, rattrapage, orphelin-historique, fermee-sans-fusion. */
export function classifyPulls(pulls, { cutoff, refs }) {
  return pulls.map((pull) => {
    const base = { number: pull.number, title: pull.title };
    if (pull.state === 'CLOSED') return { ...base, status: 'fermee-sans-fusion' };
    if (isExempt(pull)) return { ...base, status: 'exempt' };
    if (pull.number <= cutoff) {
      const covered = refs.numbers.has(pull.number);
      return { ...base, status: covered ? 'rattrapage' : 'orphelin-historique' };
    }
    return { ...base, status: linkedIssues(pull).length > 0 ? 'ok' : 'sans-issue' };
  });
}

function historicalStatus(commit, number, refs) {
  const covered = refs.shas.has(commit.sha.slice(0, SHORT)) || refs.numbers.has(number);
  return covered ? 'rattrapage' : 'orphelin-historique';
}

const noSuffixStatus = (pull) =>
  pull ? 'sans-suffixe-pr-trouvee-par-sha' : 'sans-suffixe-sans-pr';

function suffixStatus(pull, commit) {
  if (!pull) return 'suffixe-hors-pr';
  return pull.mergeCommit?.oid === commit.sha ? 'ok' : 'sha-different';
}

function currentStatus(commit, number, lookup) {
  const bySuffix = lookup.byNumber.get(number);
  const pull = bySuffix ?? lookup.bySha.get(commit.sha);
  if (pull && isExempt(pull)) return 'exempt';
  return number ? suffixStatus(bySuffix, commit) : noSuffixStatus(pull);
}

function classifyOne(commit, lookup, refs, historical) {
  const number = Number(commit.subject.match(SUFFIX)?.[1]);
  return historical
    ? historicalStatus(commit, number, refs)
    : currentStatus(commit, number, lookup);
}

/** `commits` du plus récent au plus ancien ; ceux au-delà de `cutoffSha` sont historiques. */
export function classifyCommits(commits, pulls, { cutoffSha, refs }) {
  const lookup = {
    byNumber: new Map(pulls.map((pull) => [pull.number, pull])),
    bySha: new Map(pulls.filter((p) => p.mergeCommit).map((p) => [p.mergeCommit.oid, p])),
  };
  const boundary = commits.findIndex((commit) => commit.sha === cutoffSha);
  return commits.map((commit, index) => ({
    sha: commit.sha.slice(0, SHORT),
    subject: commit.subject,
    status: classifyOne(commit, lookup, refs, boundary >= 0 && index >= boundary),
  }));
}
