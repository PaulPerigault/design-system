// Outils « documentation » : search_docs (plein texte simple) et get_decision (ADR, journal).
import { canonicalId } from '../domain/decision-id.ts';
import { indexOf, rank, searchDocs } from '../domain/search.ts';
import type { Adr, Data, Decision, Decisions } from '../domain/types.ts';
import { ToolError } from '../errors.ts';
import { defineTool } from './tool.ts';
import type { Tool } from './tool.ts';

const DECISION_RESULTS = 10;

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
  throw new ToolError(
    `décision inconnue « ${wanted} » ; connues : ${known.join(', ')}.`,
    'decision.unknown',
  );
}

export function docsTools({ docs, decisions }: Pick<Data, 'docs' | 'decisions'>): Tool[] {
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
      run: (input) => searchDocs(docsIndex, input),
    }),
    defineTool({
      name: 'get_decision',
      title: 'Lire une décision',
      description:
        'Texte d’une ADR (id : ADR-0002) ou d’une ligne du journal des décisions (id : D-021), ' +
        'ou recherche dans les décisions (query).',
      run: ({ id, query }) => (id === undefined ? find(query ?? '') : byId(decisions, id)),
    }),
  ];
}
