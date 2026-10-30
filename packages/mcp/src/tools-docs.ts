// Outils « documentation » : search_docs (plein texte simple) et get_decision (ADR, journal).
import type { Data, Decisions } from './data.ts';
import { canonicalId, defineTool, schemas, ToolError } from './schemas.ts';
import type { ToolDefinition } from './schemas.ts';
import { normalize, termsOf } from './tools-components.ts';

const TITLE_WEIGHT = 5;
const DEFAULT_LIMIT = 5;
const DECISION_RESULTS = 10;
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

type Adr = Decisions['adrs'][number];
type Decision = Decisions['decisions'][number];

const decisionEntry = (d: Decision) => ({
  id: d.id,
  kind: 'decision',
  title: `${d.id} (${d.date})`,
  body: [d.decision, d.alternative, d.rollback].filter(Boolean).join('\n'),
});
const adrEntry = (adr: Adr) => ({ id: adr.id, kind: 'adr', title: adr.title, body: adr.text });

function byId({ adrs, decisions }: Decisions, id: string) {
  const wanted = canonicalId(id);
  const adr = adrs.find((a) => a.id === wanted);
  if (adr) return { kind: 'adr', ...adr };
  const decision = decisions.find((d) => d.id === wanted);
  if (decision) return { kind: 'decision', ...decision };
  const known = [...adrs.map((a) => a.id), `D-001 à ${decisions.at(-1)?.id ?? 'D-001'}`];
  throw new ToolError(`décision inconnue « ${wanted} » ; connues : ${known.join(', ')}.`);
}

export function docsTools({ docs, decisions }: Pick<Data, 'docs' | 'decisions'>): ToolDefinition[] {
  const docsIndex = indexOf(docs, ({ title, url }) => ({ title, url }));
  const decisionIndex = indexOf(
    [...decisions.adrs.map(adrEntry), ...decisions.decisions.map(decisionEntry)],
    ({ id, kind, title }) => ({ id, kind, title }),
  );
  const find = (query: string) => ({
    query,
    results: rank(decisionIndex, query, DECISION_RESULTS),
  });
  return [
    defineTool({
      name: 'search_docs',
      title: 'Chercher dans la documentation',
      description:
        'Recherche plein texte dans la documentation embarquée (sans accents ni casse, ' +
        'titre pondéré) ; renvoie titre, adresse, score et extrait. limit : 20 au plus.',
      schema: schemas.search_docs,
      run: (input) => searchDocs(docsIndex, input),
    }),
    defineTool({
      name: 'get_decision',
      title: 'Lire une décision',
      description:
        'Texte d’une ADR (id : ADR-0002) ou d’une ligne du journal des décisions (id : D-021), ' +
        'ou recherche dans les décisions (query).',
      schema: schemas.get_decision,
      run: ({ id, query }) => (id === undefined ? find(query ?? '') : byId(decisions, id)),
    }),
  ];
}
