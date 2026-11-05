import { describe, expect, it } from 'vitest';
import { applyCatchUp, parseCatchUp, planCatchUp } from './catch-up-dates/plan.mjs';
import { run } from './sync-catch-up-dates.mjs';

const CATCH_UP = `
| Lot | Issue (titre)   | PR  | SHA       |
| --- | --------------- | --- | --------- |
| L0  | [L0] squelette  | #1  | \`13bd245\` |
| L9  | [L9] migration  | —   | —         |
| L13 | [L13] doc       | #17 | \`a0d9adc\` |

| Issue (titre)            | PR ou commit   | SHA       |
| ------------------------ | -------------- | --------- |
| [Divers 2026-10-24] arrêt | #23            | \`7bd1518\` |
|                          | #25            | \`9c426eb\` |

| PR  | SHA       | Contenu |
| --- | --------- | ------- |
| #31 | \`bd638f3\` | F1      |
`;
const issues = [
  { number: 42, title: '[L0] squelette, CI' },
  { number: 51, title: '[L9] migration du portfolio' },
  { number: 55, title: '[L13] documentation' },
  { number: 64, title: '[Divers 2026-10-24] arrêt final' },
  { number: 90, title: '[L0] hors plage' },
];
// Instants UTC : 22:30Z le 23 est déjà le 24 à Paris (heure d'été).
const pulls = [
  { number: 1, createdAt: '2026-10-20T08:00:00Z', mergedAt: '2026-10-20T20:00:00Z' },
  { number: 17, createdAt: '2026-10-22T09:00:00Z', mergedAt: '2026-10-23T22:30:00Z' },
  { number: 23, createdAt: '2026-10-24T07:00:00Z', mergedAt: '2026-10-24T08:00:00Z' },
  { number: 25, createdAt: '2026-10-24T09:00:00Z', mergedAt: '2026-10-24T18:00:00Z' },
];
const entry = (issue, extra = {}) => ({
  issue,
  start: '2026-10-28',
  due: '2026-10-28',
  kind: 'fact',
  ...extra,
});
const file = {
  fields: { start: 'Début', due: 'Échéance' },
  items: [
    entry(42),
    entry(51, { due: '2026-11-30', kind: 'estimate', note: 'n' }),
    entry(55),
    entry(64),
  ],
};

describe('parseCatchUp', () => {
  it('relie chaque préfixe de titre à ses PR, lignes de suite comprises', () => {
    const table = parseCatchUp(CATCH_UP);
    expect(Object.fromEntries(table)).toEqual({
      '[L0]': [1],
      '[L9]': [],
      '[L13]': [17],
      '[Divers 2026-10-24]': [23, 25],
    });
  });
});

describe('planCatchUp', () => {
  it('prend création et fusion des PR, à l’heure de Paris, et laisse une issue sans PR', () => {
    const plan = planCatchUp(file, { issues, pulls, catchUp: CATCH_UP });
    expect(plan.changes.map((c) => [c.issue, c.to.start, c.to.due])).toEqual([
      [42, '2026-10-20', '2026-10-20'],
      [55, '2026-10-22', '2026-10-24'],
      [64, '2026-10-24', '2026-10-24'],
    ]);
    expect(plan.changes[2].to.note).toContain('#23, #25');
    expect(plan.skipped).toEqual([{ issue: 51, reason: 'aucune PR fusionnée citée' }]);
  });

  it('est idempotent : rien à proposer une fois le plan appliqué', () => {
    const plan = planCatchUp(file, { issues, pulls, catchUp: CATCH_UP });
    const next = applyCatchUp(file, plan.changes);
    expect(next.items[1]).toEqual(file.items[1]);
    expect(planCatchUp(next, { issues, pulls, catchUp: CATCH_UP }).changes).toEqual([]);
  });
});

describe('run', () => {
  const io = (store) => ({
    gh: (args) => JSON.stringify(args[0] === 'issue' ? issues : pulls),
    read: (path) => (path.endsWith('.json') ? store.file : CATCH_UP),
    write: (path, text) => {
      store.writes.push(path);
      store.file = text;
    },
    log: () => {},
  });

  it('n’écrit rien en dry-run, écrit le fichier avec --apply, puis ne propose plus rien', () => {
    const store = { file: JSON.stringify(file), writes: [] };
    expect(run(io(store)).changes).toHaveLength(3);
    expect(store.writes).toEqual([]);
    run({ ...io(store), apply: true });
    expect(store.writes).toEqual(['.github/roadmap-dates.json']);
    expect(run({ ...io(store), apply: true }).changes).toEqual([]);
    expect(store.writes).toHaveLength(1);
  });
});
