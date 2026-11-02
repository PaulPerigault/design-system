import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DatesError, describePlan, planDates, validateDates } from './project-dates/plan.mjs';
import { sync } from './sync-project-dates.mjs';

const item = (issue, extra = {}) => ({
  issue,
  start: '2026-11-01',
  due: '2026-11-05',
  kind: 'fact',
  ...extra,
});
const wanted = {
  owner: 'o',
  project: 13,
  fields: { start: 'Début', due: 'Échéance' },
  items: [item(1), item(2)],
};

/** Faux `gh` : un Project avec deux issues et une carte de pull request, des champs de date à créer. */
function fakeGh({ withFields = false, values = {} } = {}) {
  const calls = [];
  const fields = [{ id: 'f-title', name: 'Title' }];
  if (withFields) fields.push({ id: 'f-start', name: 'Début' }, { id: 'f-due', name: 'Échéance' });
  const items = [
    { id: 'i1', content: { type: 'Issue', number: 1 }, ...values[1] },
    { id: 'i2', content: { type: 'Issue', number: 2 }, ...values[2] },
    { id: 'p9', content: { type: 'PullRequest', number: 9 } },
  ];
  const run = (args) => {
    calls.push(args.slice(0, 2).join(' '));
    const verb = args.slice(0, 2).join(' ');
    if (verb === 'project view') return JSON.stringify({ id: 'PVT' });
    if (verb === 'project field-list') return JSON.stringify({ fields });
    if (verb === 'project item-list') return JSON.stringify({ items });
    if (verb === 'project field-create') {
      const name = args[args.indexOf('--name') + 1];
      fields.push({ id: `f-${name}`, name });
    }
    if (verb === 'project item-edit') {
      const row = items.find((entry) => entry.id === args[args.indexOf('--id') + 1]);
      const name = fields.find((f) => f.id === args[args.indexOf('--field-id') + 1]).name;
      row[name.toLowerCase()] = args[args.indexOf('--date') + 1];
    }
    return '';
  };
  return { run, calls };
}

describe('validateDates', () => {
  it('accepte un fichier cohérent', () => {
    expect(() => validateDates(wanted)).not.toThrow();
  });
  it.each([
    [item(1, { start: '1 nov' }), 'AAAA-MM-JJ'],
    [item(1, { start: '2026-12-01' }), 'après'],
    [item(1, { kind: 'estimate' }), 'note'],
    [item(1, { kind: 'autre' }), 'kind'],
    [item(-1), 'invalide'],
  ])('refuse %j', (bad, text) => {
    expect(() => validateDates({ items: [bad] })).toThrow(new RegExp(text));
  });
  it('refuse une issue en double', () => {
    expect(() => validateDates({ items: [item(1), item(1)] })).toThrow(DatesError);
  });
});

describe('planDates', () => {
  it('écrit seulement ce qui diffère et signale une issue hors Project', () => {
    const current = {
      fieldNames: ['Début', 'Échéance'],
      items: new Map([[1, { itemId: 'i1', start: '2026-11-01', due: '2026-11-04' }]]),
    };
    const plan = planDates({ ...wanted, items: [item(1), item(7)] }, current);
    expect(plan.writes.map((w) => `${w.issue}:${w.field}`)).toEqual(['1:Échéance']);
    expect(plan.unknown).toEqual([7]);
    expect(describePlan(plan)).toEqual(['~ #1 Échéance = 2026-11-05', '? #7 absente du Project']);
  });
});

describe('sync', () => {
  it('ne fait que lire en dry-run', () => {
    const { run, calls } = fakeGh();
    const { plan, applied } = sync(wanted, run);
    expect(applied).toBe(false);
    expect(plan.createFields).toEqual(['Début', 'Échéance']);
    expect(calls.filter((c) => /create|edit/.test(c))).toEqual([]);
  });
  it('crée les champs puis écrit les dates avec --apply, et ne réécrit rien ensuite', () => {
    const { run, calls } = fakeGh();
    sync(wanted, run, { apply: true });
    expect(calls.filter((c) => c === 'project field-create')).toHaveLength(2);
    expect(calls.filter((c) => c === 'project item-edit')).toHaveLength(4);
    const again = fakeGh({
      withFields: true,
      values: {
        1: { début: '2026-11-01', échéance: '2026-11-05' },
        2: { début: '2026-11-01', échéance: '2026-11-05' },
      },
    });
    const { plan } = sync(wanted, again.run, { apply: true });
    expect(plan).toEqual({ createFields: [], writes: [], unknown: [] });
    expect(again.calls.filter((c) => /create|edit/.test(c))).toEqual([]);
  });
});

describe('fichier du dépôt', () => {
  const file = JSON.parse(readFileSync('.github/roadmap-dates.json', 'utf8'));
  it('est valide et marque chaque estimation', () => {
    expect(() => validateDates(file)).not.toThrow();
    const estimates = file.items.filter((entry) => entry.kind === 'estimate');
    expect(estimates.every((entry) => entry.note.length > 0)).toBe(true);
    expect(file.items.some((entry) => entry.kind === 'fact')).toBe(true);
  });
});
