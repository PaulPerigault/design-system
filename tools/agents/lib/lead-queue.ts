// File de travail de ds-lead (`.agents/lead-queue.md`, hors git) : une section par lot,
//   ## L8 · statut : à faire · base : main · essais : 0
// suivie de la spécification du lot (et, si renvoyé, des retours de l'orchestrateur).
// Statuts : à faire, en cours, prêt pour validation, renvoyé, validé, abandonné.

export const STATUSES = [
  'à faire',
  'en cours',
  'prêt pour validation',
  'renvoyé',
  'validé',
  'abandonné',
];
const HEADER = /^## (L[\w.-]+) · statut : ([^·]+?) · base : (\S+) · essais : (\d+)\s*$/;
const RUNNABLE = new Set(['à faire', 'renvoyé']);
export const MAX_ATTEMPTS = 2;

export interface Lot {
  id: string;
  status: string;
  base: string;
  attempts: number;
  body: string;
}

export interface Queue {
  preamble: string;
  lots: Lot[];
}

export function parseQueue(text: string): Queue {
  const preamble: string[] = [];
  const lots: (Omit<Lot, 'body'> & { body: string[] })[] = [];
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    const [, id, status, base, attempts] = HEADER.exec(line) ?? [];
    const last = lots.at(-1);
    if (id !== undefined && status !== undefined && base !== undefined) {
      lots.push({ id, status: status.trim(), base, attempts: Number(attempts), body: [] });
    } else if (last) last.body.push(line);
    else preamble.push(line);
  }
  return {
    preamble: preamble.join('\n').trimEnd(),
    lots: lots.map((lot) => ({ ...lot, body: lot.body.join('\n').trim() })),
  };
}

export function serializeQueue({ preamble, lots }: Queue): string {
  const sections = lots.map(
    (lot) =>
      `## ${lot.id} · statut : ${lot.status} · base : ${lot.base} · essais : ${lot.attempts}\n\n${lot.body}`,
  );
  return `${[preamble, ...sections].filter(Boolean).join('\n\n')}\n`;
}

/** Prochain lot à traiter (à faire ou renvoyé, essais restants), ou null si la file est vide. */
export const nextLot = (queue: Queue): Lot | null =>
  queue.lots.find((lot) => RUNNABLE.has(lot.status) && lot.attempts < MAX_ATTEMPTS) ?? null;

/** Copie de la file avec le lot `id` modifié. */
export const updateLot = (queue: Queue, id: string, changes: Partial<Lot>): Queue => ({
  ...queue,
  lots: queue.lots.map((lot) => (lot.id === id ? { ...lot, ...changes } : lot)),
});

/** Statut après une session terminée : prêt si ds-lead l'a marqué, sinon nouvel essai ou abandon. */
export function statusAfterSession(lot: Pick<Lot, 'status' | 'attempts'>): string {
  if (lot.status === 'prêt pour validation') return lot.status;
  return lot.attempts >= MAX_ATTEMPTS ? 'abandonné' : 'à faire';
}
