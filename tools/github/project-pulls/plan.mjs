// Plan pur des PR fusionnées à mettre dans le Project : toute PR
// fusionnée de numéro ≥ SINCE y figure avec Début = création et Échéance = fusion. Aucune E/S.
import { parisDay } from '../project-dates/day.mjs';

export const SINCE = 38;

/**
 * @param {{ number: number, url: string, state: string, createdAt: string, mergedAt: string }[]} pulls
 * @param {Map<number, { itemId: string, start?: string, due?: string }>} current PR du Project
 * @param {{ start: string, due: string }} fields noms des champs de date
 * @returns {{ add: object[], writes: object[] }}
 */
export function planPulls(pulls, current, fields, since = SINCE) {
  const add = [];
  const writes = [];
  const merged = pulls.filter((pull) => pull.state === 'MERGED' && pull.number >= since);
  for (const pull of merged.sort((a, b) => a.number - b.number)) {
    const start = parisDay(pull.createdAt);
    const due = parisDay(pull.mergedAt);
    const known = current.get(pull.number);
    if (!known) {
      add.push({ number: pull.number, url: pull.url, start, due });
      continue;
    }
    if (known.start !== start)
      writes.push({ number: pull.number, itemId: known.itemId, field: fields.start, value: start });
    if (known.due !== due)
      writes.push({ number: pull.number, itemId: known.itemId, field: fields.due, value: due });
  }
  return { add, writes };
}

export function describePulls({ add, writes }) {
  return [
    ...add.map((a) => `+ PR #${a.number} ${a.start} -> ${a.due}`),
    ...writes.map((w) => `~ PR #${w.number} ${w.field} = ${w.value}`),
  ];
}
