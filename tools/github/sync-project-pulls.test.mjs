import { describe, expect, it } from 'vitest';
import { planPulls } from './project-pulls/plan.mjs';
import { run } from './sync-project-pulls.mjs';

const DAMAGED = '��chéance'; // clé renvoyée par `gh project item-list` (2026-11-05)
const fields = { start: 'Début', due: 'Échéance' };
const pull = (number, extra = {}) => ({
  number,
  url: `https://github.com/o/r/pull/${number}`,
  state: 'MERGED',
  createdAt: '2026-11-01T10:00:00Z',
  mergedAt: '2026-11-02T10:00:00Z',
  ...extra,
});

describe('planPulls', () => {
  it('ajoute les PR fusionnées depuis #38 et corrige les dates des PR déjà présentes', () => {
    const current = new Map([
      [40, { itemId: 'i40', start: '2026-11-01', due: '2026-11-02' }],
      [41, { itemId: 'i41', start: '2026-11-01' }],
    ]);
    const pulls = [pull(37), pull(39), pull(40), pull(41), pull(42, { state: 'OPEN' })];
    const plan = planPulls(pulls, current, fields);
    expect(plan.add.map((a) => [a.number, a.start, a.due])).toEqual([
      [39, '2026-11-01', '2026-11-02'],
    ]);
    expect(plan.writes).toEqual([
      { number: 41, itemId: 'i41', field: 'Échéance', value: '2026-11-02' },
    ]);
  });
});

/** Faux `gh` : Project avec une issue et la PR #50 (sans dates) ; écrit les clés comme gh les rend. */
function fakeGh() {
  const calls = [];
  const items = [
    { id: 'i1', content: { type: 'Issue', number: 1 } },
    { id: 'p50', content: { type: 'PullRequest', number: 50 } },
  ];
  const projectFields = [
    { id: 'f-start', name: 'Début' },
    { id: 'f-due', name: 'Échéance' },
  ];
  const keys = { 'f-start': 'début', 'f-due': DAMAGED };
  const arg = (args, flag) => args[args.indexOf(flag) + 1];
  const handlers = {
    'project view': () => ({ id: 'PVT' }),
    'project field-list': () => ({ fields: projectFields }),
    'project item-list': () => ({ items }),
    'pr list': () => [pull(37), pull(50), pull(51)],
    'project item-add': (args) => {
      const number = Number(arg(args, '--url').split('/').at(-1));
      items.push({ id: `p${number}`, content: { type: 'PullRequest', number } });
      return { id: `p${number}` };
    },
    'project item-edit': (args) => {
      const row = items.find((item) => item.id === arg(args, '--id'));
      row[keys[arg(args, '--field-id')]] = arg(args, '--date');
      return {};
    },
  };
  const gh = (args) => {
    const verb = args.slice(0, 2).join(' ');
    calls.push(verb);
    return JSON.stringify(handlers[verb](args));
  };
  return { gh, calls };
}

const io = (fake) => ({
  gh: fake.gh,
  read: () => JSON.stringify({ owner: 'o', project: 13, fields }),
  log: () => {},
});

describe('run', () => {
  it('ne fait que lire en dry-run', () => {
    const fake = fakeGh();
    const plan = run(io(fake));
    expect(plan.add.map((a) => a.number)).toEqual([51]);
    expect(plan.writes).toHaveLength(2);
    expect(fake.calls.filter((c) => /add|edit/.test(c))).toEqual([]);
  });

  it('ajoute et date avec --apply, puis ne propose plus rien malgré la clé abîmée', () => {
    const fake = fakeGh();
    run({ ...io(fake), apply: true });
    expect(fake.calls.filter((c) => c === 'project item-add')).toHaveLength(1);
    expect(fake.calls.filter((c) => c === 'project item-edit')).toHaveLength(4);
    expect(run({ ...io(fake), apply: true })).toEqual({ add: [], writes: [] });
    expect(fake.calls.filter((c) => c === 'project item-edit')).toHaveLength(4);
  });
});
