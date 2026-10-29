/** Données de la démonstration de l'accueil : décisions du journal, cumul par jour. */
import type { Dataset } from '@paulperigault/dataviz';

const PREVIOUS_DAY = -2;
const DECISION_ROW = /^\| D-\d+ \| (\d{4}-\d{2}-\d{2}) \|/;

export interface DecisionTotal {
  date: string;
  total: number;
}

/** Cumul des décisions par jour, à partir des lignes `| D-… | AAAA-MM-JJ |` du journal. */
export function decisionTotals(log: string): DecisionTotal[] {
  const perDay = new Map<string, number>();
  for (const line of log.split('\n')) {
    const date = DECISION_ROW.exec(line)?.[1];
    if (date !== undefined) perDay.set(date, (perDay.get(date) ?? 0) + 1);
  }
  let total = 0;
  return [...perDay.keys()].sort().map((date) => {
    total += perDay.get(date) ?? 0;
    return { date, total };
  });
}

export function decisionDataset(totals: readonly DecisionTotal[]): Dataset {
  return {
    schema: 1,
    x: { kind: 'time', label: 'Jour', values: totals.map(({ date }) => date) },
    series: [
      {
        id: 'decisions',
        label: 'Décisions enregistrées',
        unit: 'décisions',
        values: totals.map(({ total }) => total),
      },
    ],
  };
}

export interface DecisionKpi {
  value: number;
  reference: number | null;
  date: string;
}

/** Valeur du dernier jour et cumul du jour précédent (`null` s'il n'y a qu'un jour). */
export function decisionKpi(totals: readonly DecisionTotal[]): DecisionKpi | null {
  const last = totals.at(-1);
  if (last === undefined) return null;
  return { value: last.total, reference: totals.at(PREVIOUS_DAY)?.total ?? null, date: last.date };
}
