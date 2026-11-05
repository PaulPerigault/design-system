import { describe, expect, it } from 'vitest';
import { planDates } from './plan.mjs';
import { readProject } from './project-io.mjs';

// Clé réelle renvoyée par `gh project item-list --format json` (gh 2.x, 2026-11-05) :
// l'initiale « É » devient deux U+FFFD, « début » reste intacte.
const DAMAGED = Buffer.from('efbfbdefbfbd6368c3a9616e6365', 'hex').toString('utf8');
const names = { start: 'Début', due: 'Échéance' };

function fakeGh(values) {
  const items = [
    { id: 'i1', content: { type: 'Issue', number: 1 }, ...values },
    { id: 'p9', content: { type: 'PullRequest', number: 9 }, [DAMAGED]: '2026-11-03' },
  ];
  const fields = [
    { id: 'f-start', name: 'Début' },
    { id: 'f-due', name: 'Échéance' },
  ];
  return (args) => {
    const verb = args.slice(0, 2).join(' ');
    if (verb === 'project view') return JSON.stringify({ id: 'PVT' });
    if (verb === 'project field-list') return JSON.stringify({ fields });
    return JSON.stringify({ items });
  };
}

describe('readProject', () => {
  it('lit « Échéance » malgré la clé abîmée par gh', () => {
    expect(DAMAGED).toBe('��chéance');
    const run = fakeGh({ début: '2026-11-01', [DAMAGED]: '2026-11-05' });
    const state = readProject(run, { owner: 'o', project: 13 }, names);
    expect(state.items.get(1)).toEqual({ itemId: 'i1', start: '2026-11-01', due: '2026-11-05' });
    expect(state.items.has(9)).toBe(false);
  });

  it('rend le dry-run idempotent : aucune réécriture quand les dates sont posées', () => {
    const run = fakeGh({ début: '2026-11-01', [DAMAGED]: '2026-11-05' });
    const state = readProject(run, { owner: 'o', project: 13 }, names);
    const wanted = {
      fields: names,
      items: [{ issue: 1, start: '2026-11-01', due: '2026-11-05', kind: 'fact' }],
    };
    const current = { fieldNames: state.fields.map((f) => f.name), items: state.items };
    expect(planDates(wanted, current).writes).toEqual([]);
  });

  it('lit aussi une clé intacte', () => {
    const run = fakeGh({ début: '2026-11-01', échéance: '2026-11-04' });
    const state = readProject(run, { owner: 'o', project: 13 }, names);
    expect(state.items.get(1).due).toBe('2026-11-04');
  });
});
