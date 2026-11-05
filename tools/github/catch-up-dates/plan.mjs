// Plan pur des dates de rattrapage (décision Q23, issue #290) : les issues #42 à #66 prennent les
// dates des PR que cite `docs/history/catch-up.md` (Début = création, Échéance = fusion). Aucune E/S.
import { parisDay } from '../project-dates/day.mjs';

export const RANGE = { first: 42, last: 66 };
const PREFIX = /^\[[^\]]+\]/;
const PULL = /^#(\d+)$/;

const cells = (line) =>
  line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());

/** Table « [préfixe de titre] → numéros de PR » lue dans les tableaux de catch-up.md. */
export function parseCatchUp(text) {
  const table = new Map();
  let current = null;
  for (const line of text.split('\n').filter((l) => l.startsWith('|'))) {
    const row = cells(line);
    const title = row.map((cell) => cell.match(PREFIX)?.[0]).find(Boolean);
    if (title) current = title;
    else if (row[0] !== '') current = null;
    if (!current) continue;
    const pulls = row.map((cell) => Number(cell.match(PULL)?.[1])).filter(Boolean);
    table.set(current, [...(table.get(current) ?? []), ...pulls]);
  }
  return table;
}

function datesOf(numbers, pulls) {
  const found = numbers.map((n) => pulls.get(n)).filter((pull) => pull?.mergedAt);
  if (found.length !== numbers.length || found.length === 0) return null;
  const starts = found.map((pull) => parisDay(pull.createdAt)).sort();
  const dues = found.map((pull) => parisDay(pull.mergedAt)).sort();
  return { start: starts[0], due: dues.at(-1) };
}

const noteOf = (numbers) =>
  `PR ${numbers.map((n) => `#${n}`).join(', ')} : création et fusion (catch-up.md)`;

const inRange = (issue) => issue.number >= RANGE.first && issue.number <= RANGE.last;
const same = (entry, dates) =>
  entry.start === dates.start && entry.due === dates.due && entry.kind === 'fact';

/** Verdict pour une issue : `{ change }`, `{ skip }` ou `{}` si l'entrée est déjà juste. */
function judge(issue, { table, byNumber, entries }) {
  const numbers = table.get(issue.title.match(PREFIX)?.[0]) ?? [];
  const dates = numbers.length > 0 ? datesOf(numbers, byNumber) : null;
  const entry = entries.get(issue.number);
  if (!dates) return { skip: { issue: issue.number, reason: 'aucune PR fusionnée citée' } };
  if (!entry) return { skip: { issue: issue.number, reason: 'absente du fichier' } };
  if (same(entry, dates)) return {};
  return { change: { issue: issue.number, from: entry, to: { ...dates, note: noteOf(numbers) } } };
}

/**
 * @param {{ items: object[] }} file `.github/roadmap-dates.json`
 * @param {{ issues: {number: number, title: string}[], pulls: object[], catchUp: string }} data
 * @returns {{ changes: object[], skipped: {issue: number, reason: string}[] }}
 */
export function planCatchUp(file, { issues, pulls, catchUp }) {
  const context = {
    table: parseCatchUp(catchUp),
    byNumber: new Map(pulls.map((pull) => [pull.number, pull])),
    entries: new Map(file.items.map((item) => [item.issue, item])),
  };
  const verdicts = issues.filter(inRange).map((issue) => judge(issue, context));
  const changes = verdicts.map((v) => v.change).filter(Boolean);
  const skipped = verdicts.map((v) => v.skip).filter(Boolean);
  return { changes: changes.sort((a, b) => a.issue - b.issue), skipped };
}

/** Fichier voulu après application du plan (copie ; l'ordre et les autres entrées sont gardés). */
export function applyCatchUp(file, changes) {
  const byIssue = new Map(changes.map((change) => [change.issue, change.to]));
  const items = file.items.map((item) => {
    const to = byIssue.get(item.issue);
    return to ? { ...item, start: to.start, due: to.due, kind: 'fact', note: to.note } : item;
  });
  return { ...file, items };
}

export function describeCatchUp({ changes, skipped }) {
  return [
    ...changes.map(
      (c) => `~ #${c.issue} ${c.from.start}/${c.from.due} -> ${c.to.start}/${c.to.due}`,
    ),
    ...skipped.map((s) => `? #${s.issue} inchangée : ${s.reason}`),
  ];
}
