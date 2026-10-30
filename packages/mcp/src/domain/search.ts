// Recherche plein texte simple : index normalisé une fois, score par occurrences (titre pondéré).
import { normalize, termsOf } from './text.ts';

const TITLE_WEIGHT = 5;
const DEFAULT_LIMIT = 5;
const EXCERPT_RADIUS = 120;

type Entry = { title: string; body: string };
export type IndexedEntry<V> = Entry & { normalTitle: string; normalBody: string; view: V };

const occurrences = (haystack: string, term: string): number => haystack.split(term).length - 1;
const squash = (text: string): string => text.replace(/\s+/g, ' ').trim();

function excerptOf(entry: { body: string; normalBody: string }, terms: string[]): string {
  const positions = terms.map((t) => entry.normalBody.indexOf(t)).filter((i) => i >= 0);
  const at = positions.length > 0 ? Math.min(...positions) : 0;
  const start = Math.max(0, at - EXCERPT_RADIUS);
  return `${start > 0 ? '…' : ''}${squash(entry.body.slice(start, at + EXCERPT_RADIUS))}…`;
}

/** Index : titre et corps normalisés une fois ; `view(entry)` : champs renvoyés au client. */
export const indexOf = <E extends Entry, V>(
  entries: E[],
  view: (entry: E) => V,
): IndexedEntry<V>[] =>
  entries.map((entry) => ({
    title: entry.title,
    body: entry.body,
    normalTitle: normalize(entry.title),
    normalBody: normalize(entry.body),
    view: view(entry),
  }));

const scoreOf = (entry: { normalTitle: string; normalBody: string }, terms: string[]): number =>
  terms.reduce(
    (sum, t) =>
      sum + occurrences(entry.normalTitle, t) * TITLE_WEIGHT + occurrences(entry.normalBody, t),
    0,
  );

/** Classe par occurrences (titre pondéré) ; écarte les entrées sans aucun terme. */
export function rank<V extends object>(index: IndexedEntry<V>[], query: string, limit: number) {
  const terms = termsOf(query);
  return index
    .map((entry) => ({ entry, score: scoreOf(entry, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, 'fr'))
    .slice(0, limit)
    .map(({ entry, score }) => ({ ...entry.view, score, excerpt: excerptOf(entry, terms) }));
}

export function searchDocs<V extends object>(
  index: IndexedEntry<V>[],
  { query, limit = DEFAULT_LIMIT }: { query: string; limit?: number | undefined },
) {
  const results = rank(index, query, limit);
  return { query, count: results.length, results };
}
