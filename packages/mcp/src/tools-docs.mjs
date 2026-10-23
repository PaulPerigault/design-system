// Outils « documentation » : search_docs (plein texte simple) et get_decision (ADR, journal).
import { ToolError } from './schemas.mjs';

const TITLE_WEIGHT = 5;
const DEFAULT_LIMIT = 5;
const DECISION_RESULTS = 10;
const MIN_TERM = 2;
const EXCERPT_RADIUS = 120;
const ID_DIGITS = Object.freeze({ ADR: 4, D: 3 });

/** Minuscules, sans accents (NFD puis retrait des diacritiques). */
export const normalize = (text) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function termsOf(query) {
  const words = normalize(query)
    .split(/[^\p{L}\p{N}-]+/u)
    .filter((word) => word.length >= MIN_TERM);
  if (words.length === 0) throw new ToolError('requête trop courte (un mot de 2 lettres).');
  return [...new Set(words)];
}

const occurrences = (haystack, term) => haystack.split(term).length - 1;
const squash = (text) => text.replace(/\s+/g, ' ').trim();

function excerptOf(entry, terms) {
  const positions = terms.map((t) => entry.normalBody.indexOf(t)).filter((i) => i >= 0);
  const at = positions.length > 0 ? Math.min(...positions) : 0;
  const start = Math.max(0, at - EXCERPT_RADIUS);
  return `${start > 0 ? '…' : ''}${squash(entry.body.slice(start, at + EXCERPT_RADIUS))}…`;
}

/** Index : titre et corps normalisés une fois ; `view(entry)` : champs renvoyés au client. */
export const indexOf = (entries, view) =>
  entries.map((entry) => ({
    title: entry.title,
    body: entry.body,
    normalTitle: normalize(entry.title),
    normalBody: normalize(entry.body),
    view: view(entry),
  }));

const scoreOf = (entry, terms) =>
  terms.reduce(
    (sum, t) =>
      sum + occurrences(entry.normalTitle, t) * TITLE_WEIGHT + occurrences(entry.normalBody, t),
    0,
  );

/** Classe par occurrences (titre pondéré) ; écarte les entrées sans aucun terme. */
export function rank(index, query, limit) {
  const terms = termsOf(query);
  return index
    .map((entry) => ({ entry, score: scoreOf(entry, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, 'fr'))
    .slice(0, limit)
    .map(({ entry, score }) => ({ ...entry.view, score, excerpt: excerptOf(entry, terms) }));
}

export function searchDocs(index, { query, limit = DEFAULT_LIMIT }) {
  const results = rank(index, query, limit);
  return { query, count: results.length, results };
}

/** `adr-3` → `ADR-0003` ; `d-21` → `D-021`. */
export function canonicalId(id) {
  const [kind, number] = id.toUpperCase().split('-');
  return `${kind}-${number.padStart(ID_DIGITS[kind], '0')}`;
}

const decisionEntry = (d) => ({
  id: d.id,
  kind: 'decision',
  title: `${d.id} (${d.date})`,
  body: `${d.decision}\n${d.alternative}\n${d.rollback}`,
});
const adrEntry = (adr) => ({ id: adr.id, kind: 'adr', title: adr.title, body: adr.text });

function byId({ adrs, decisions }, id) {
  const wanted = canonicalId(id);
  const adr = adrs.find((a) => a.id === wanted);
  if (adr) return { kind: 'adr', ...adr };
  const decision = decisions.find((d) => d.id === wanted);
  if (decision) return { kind: 'decision', ...decision };
  const known = [...adrs.map((a) => a.id), `D-001 à ${decisions.at(-1)?.id ?? 'D-001'}`];
  throw new ToolError(`décision inconnue « ${wanted} » ; connues : ${known.join(', ')}.`);
}

/** @param {{ docs: object[], decisions: { adrs: object[], decisions: object[] } }} data */
export function docsTools({ docs, decisions }) {
  const docsIndex = indexOf(docs, ({ title, url }) => ({ title, url }));
  const decisionIndex = indexOf(
    [...decisions.adrs.map(adrEntry), ...decisions.decisions.map(decisionEntry)],
    ({ id, kind, title }) => ({ id, kind, title }),
  );
  const findDecisions = (query) => ({
    query,
    results: rank(decisionIndex, query, DECISION_RESULTS),
  });
  return [
    {
      name: 'search_docs',
      title: 'Chercher dans la documentation',
      description:
        'Recherche plein texte dans la documentation embarquée (sans accents ni casse, ' +
        'titre pondéré) ; renvoie titre, adresse, score et extrait. limit : 20 au plus.',
      run: (input) => searchDocs(docsIndex, input),
    },
    {
      name: 'get_decision',
      title: 'Lire une décision',
      description:
        'Texte d’une ADR (id : ADR-0002) ou d’une ligne du journal des décisions (id : D-021), ' +
        'ou recherche dans les décisions (query).',
      run: ({ id, query }) => (id === undefined ? findDecisions(query) : byId(decisions, id)),
    },
  ];
}
