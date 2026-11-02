// Plan pur de synchronisation des dates du Project : valide le fichier voulu, compare à l'état
// courant et liste les champs à créer et les valeurs à écrire. Aucune E/S ici.
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const KINDS = new Set(['fact', 'estimate']);

export class DatesError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'DatesError';
    this.code = code;
  }
}

const RULES = [
  [(item) => !Number.isInteger(item.issue) || item.issue <= 0, 'numéro d’issue invalide'],
  [(item, seen) => seen.has(item.issue), 'issue en double'],
  [(item) => !DATE.test(item.start) || !DATE.test(item.due), 'date hors AAAA-MM-JJ'],
  [(item) => item.start > item.due, 'début après l’échéance'],
  [(item) => !KINDS.has(item.kind), 'kind hors fact ou estimate'],
  [(item) => item.kind === 'estimate' && !item.note, 'une estimation exige une note'],
];

const problem = (item, seen) => RULES.find(([broken]) => broken(item, seen))?.[1] ?? null;

/** Lève `DatesError('invalid-dates')` si le fichier voulu est incohérent. */
export function validateDates(file) {
  const seen = new Set();
  for (const item of file.items) {
    const found = problem(item, seen);
    if (found) throw new DatesError('invalid-dates', `#${item.issue} : ${found}`);
    seen.add(item.issue);
  }
}

/**
 * @param {{ fields: { start: string, due: string }, items: object[] }} wanted fichier voulu
 * @param {{ fieldNames: string[], items: Map<number, { itemId: string, start?: string, due?: string }> }} current
 * @returns {{ createFields: string[], writes: object[], unknown: number[] }}
 */
export function planDates(wanted, current) {
  const { start, due } = wanted.fields;
  const createFields = [start, due].filter((name) => !current.fieldNames.includes(name));
  const writes = [];
  const unknown = [];
  for (const item of wanted.items) {
    const known = current.items.get(item.issue);
    if (!known) unknown.push(item.issue);
    else {
      if (known.start !== item.start)
        writes.push({ issue: item.issue, itemId: known.itemId, field: start, value: item.start });
      if (known.due !== item.due)
        writes.push({ issue: item.issue, itemId: known.itemId, field: due, value: item.due });
    }
  }
  return { createFields, writes, unknown };
}

export function describePlan({ createFields, writes, unknown }) {
  return [
    ...createFields.map((name) => `+ champ ${name}`),
    ...writes.map((w) => `~ #${w.issue} ${w.field} = ${w.value}`),
    ...unknown.map((n) => `? #${n} absente du Project`),
  ];
}
