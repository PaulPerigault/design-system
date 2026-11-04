import { describe, expect, it } from 'vitest';
import { catchUpRefs, classifyCommits, classifyPulls, linkedIssues } from './pull-rules.mjs';

const pull = (number, extra = {}) => ({
  number,
  title: `PR ${number}`,
  state: 'MERGED',
  headRefName: `docs/${number}-x`,
  author: { login: 'PaulPerigault' },
  body: '',
  closingIssuesReferences: [],
  ...extra,
});
const refs = catchUpRefs(['PR #5 `aaf4560`']);

describe('pull-rules', () => {
  it('lit Closes et Refs dans le corps, et le lien GitHub', () => {
    expect(linkedIssues(pull(9, { body: 'Closes #4\n\nRefs #7' })).sort()).toEqual([4, 7]);
    expect(linkedIssues(pull(9, { closingIssuesReferences: [{ number: 3 }] }))).toEqual([3]);
  });

  it('classe les PR : issue, exemption, rattrapage, orphelin', () => {
    const pulls = [
      pull(50, { body: 'Refs #3' }),
      pull(51),
      pull(52, { headRefName: 'release-please--branches--main' }),
      pull(5),
      pull(6),
      pull(53, { state: 'CLOSED' }),
    ];
    const status = classifyPulls(pulls, { cutoff: 37, refs }).map((r) => r.status);
    expect(status).toEqual([
      'ok',
      'sans-issue',
      'exempt',
      'rattrapage',
      'orphelin-historique',
      'fermee-sans-fusion',
    ]);
  });

  it('retrouve la PR d’un commit par son suffixe ou par son SHA', () => {
    const sha = (c) => c.repeat(40);
    const pulls = [
      pull(60, { mergeCommit: { oid: sha('a') } }),
      pull(61, { mergeCommit: { oid: sha('b') } }),
    ];
    const commits = [
      { sha: sha('a'), subject: 'feat: x (#60)' },
      { sha: sha('b'), subject: 'feat: y' },
      { sha: sha('c'), subject: 'feat: z (#99)' },
      { sha: sha('d'), subject: 'feat: sans pr' },
      { sha: sha('e'), subject: 'chore: ancien' },
    ];
    const rows = classifyCommits(commits, pulls, { cutoffSha: sha('e'), refs });
    expect(rows.map((r) => r.status)).toEqual([
      'ok',
      'sans-suffixe-pr-trouvee-par-sha',
      'suffixe-hors-pr',
      'sans-suffixe-sans-pr',
      'orphelin-historique',
    ]);
  });
});
