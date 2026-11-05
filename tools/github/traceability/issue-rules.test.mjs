import { describe, expect, it } from 'vitest';
import { checkIssue, classifyBranches, exemptions, field } from './issue-rules.mjs';

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

describe('issue-rules', () => {
  it('une issue complète n’a aucune anomalie', () => {
    const item = { début: '2026-11-01', échéance: '2026-11-02', status: 'Fait' };
    expect(checkIssue(issue(), { item })).toEqual([]);
  });

  it('liste les anomalies d’une issue nue', () => {
    const bare = issue({ labels: [], assignees: [], milestone: null, body: 'Issue parente : #66' });
    expect(checkIssue(bare, { item: undefined })).toEqual([
      'label-type',
      'label-pkg',
      'label-taille',
      'label-prio',
      'non-assignee',
      'sans-jalon',
      'hors-project',
      'parent-non-lie',
    ]);
  });

  it('exempte une issue de rattrapage du label prio: (Q24), pas des autres labels', () => {
    const item = { début: '2026-10-20', échéance: '2026-10-20', status: 'Fait' };
    const catchUp = issue({ labels: [{ name: 'type:rattrapage' }, { name: 'pkg:ci' }] });
    expect(checkIssue(catchUp, { item })).toEqual(['label-taille']);
    expect(exemptions(catchUp)).toEqual(['prio-rattrapage']);
    expect(exemptions(issue())).toEqual([]);
    const withPrio = { labels: [...labels, { name: 'type:rattrapage' }] };
    expect(exemptions(issue(withPrio))).toEqual([]);
  });

  it('lit un champ dont l’initiale accentuée est abîmée', () => {
    expect(field({ '��chéance': '2026-11-02' }, 'échéance')).toBe('2026-11-02');
    expect(field({ Début: 'x' }, 'début')).toBe('x');
  });

  it('classe les branches', () => {
    const pulls = [pull(60, { headRefName: 'docs/60-a' }), pull(61, { headRefName: 'lot/L1' })];
    const names = { local: ['main', 'docs/60-a'], remote: ['lot/L1', 'tmp/x', 'dependabot/npm/y'] };
    expect(classifyBranches(names, pulls).map((b) => b.status)).toEqual([
      'principale',
      'fusionnee-non-supprimee',
      'fusionnee-non-supprimee',
      'orpheline',
      'exempt',
    ]);
  });
});
