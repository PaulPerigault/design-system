import { describe, expect, it } from 'vitest';
import { analyse } from './analyse.mjs';
import { formatReport } from './format.mjs';

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
const labels = ['type:tache', 'pkg:ci', 'taille:trait', 'prio:normale'].map((name) => ({ name }));
const issue = (extra = {}) => ({
  number: 1,
  labels,
  assignees: [{}],
  milestone: {},
  body: '',
  ...extra,
});

describe('analyse et format', () => {
  const data = {
    issues: [issue({ number: 42, body: 'PR #5' })],
    pulls: [pull(5), pull(60)],
    items: [{ content: { type: 'Issue', number: 42 }, status: 'Fait' }],
    parents: new Map(),
    commits: [],
    branches: { local: ['main'], remote: [] },
    milestones: [{ title: 'M5', due_on: null, open_issues: 2, closed_issues: 0 }],
    catchUp: '',
    unreadable: ['jalons illisible : x'],
  };

  it('rapporte sans lever, même avec des lectures manquantes', () => {
    const report = analyse(data);
    expect(report.pullProject.map((r) => r.problems)).toEqual([['hors-project'], ['hors-project']]);
    expect(report.milestones[0].problems).toEqual(['echeance-vide']);
    const text = formatReport(report, { all: true });
    expect(text).toContain('## Issues (1)');
    expect(text).toContain('[À VÉRIFIER] jalons illisible : x');
  });

  it('affiche les exemptions sans les compter comme écarts', () => {
    const rattrapage = [{ name: 'type:rattrapage' }, { name: 'pkg:ci' }, { name: 'taille:page' }];
    const item = {
      content: { type: 'Issue', number: 43 },
      status: 'Fait',
      début: 'a',
      échéance: 'b',
    };
    const report = analyse({
      ...data,
      issues: [issue({ number: 43, labels: rattrapage })],
      items: [item],
    });
    expect(report.issues[0].problems).toEqual([]);
    expect(formatReport(report)).toContain('exemptions : prio-rattrapage 1');
  });
});
