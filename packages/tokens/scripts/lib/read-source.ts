/**
 * Lecture de la source DTCG via le resolver (DTCG Resolver 2025.10, sous-ensemble utilisé) :
 * `sets` fusionnés forment la base, chaque contexte du modificateur `theme` forme un thème.
 * Le lecteur de texte est injecté : `readText(nom)` rend le contenu d'un fichier de `src/tokens/`.
 */

import type { DtcgNode, Source } from './types.ts';
import { isRecord, TokenError } from './types.ts';

/** Fusion profonde : les groupes se combinent, une feuille ultérieure remplace la précédente. */
export function merge(target: DtcgNode, source: DtcgNode): DtcgNode {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const current = result[key];
    const both = isRecord(current) && isRecord(value) && !('$value' in value);
    result[key] = both ? merge(current, value) : value;
  }
  return result;
}

type SourceRef = string | { $ref: string };

const invalid = (message: string): TokenError => new TokenError('invalid-source', message);

const isRef = (value: unknown): value is SourceRef =>
  typeof value === 'string' || (isRecord(value) && typeof value.$ref === 'string');

/** Une source peut être un nom de fichier ou une référence `{ "$ref": "fichier.json" }`. */
const sourceName = (source: SourceRef): string =>
  typeof source === 'string' ? source : source.$ref;

/** Liste de sources d'un ensemble ou d'un contexte du resolver ; refuse toute autre forme. */
function refsOf(value: unknown, where: string): SourceRef[] {
  if (!Array.isArray(value) || !value.every(isRef)) {
    throw invalid(`resolver : « ${where} » doit être une liste de fichiers ou de { $ref }.`);
  }
  return value;
}

function recordOf(value: unknown, where: string): Record<string, unknown> {
  if (value === undefined) return {};
  if (!isRecord(value)) throw invalid(`resolver : « ${where} » doit être un objet.`);
  return value;
}

/**
 * Le resolver et chaque fichier sont validés à l'entrée : le JSON est inconnu tant qu'il n'a pas
 * la forme attendue. `readText(nom)` rend le contenu d'un fichier de `src/tokens/`.
 */
export function readSource(
  readText: (name: string) => string,
  resolverName = 'resolver.json',
): Source {
  const parse = (name: string): DtcgNode => {
    const data: unknown = JSON.parse(readText(name));
    if (!isRecord(data)) throw invalid(`${name} : un objet JSON est attendu.`);
    return data;
  };
  const load = (sources: SourceRef[]): DtcgNode =>
    sources.map(sourceName).map(parse).reduce(merge, {});
  const resolver = parse(resolverName);
  const sets = Object.entries(recordOf(resolver.sets, 'sets'));
  const modifiers = recordOf(resolver.modifiers, 'modifiers');
  const contexts = Object.entries(
    recordOf(recordOf(modifiers.theme, 'theme').contexts, 'contexts'),
  );
  return {
    base: load(
      sets.flatMap(([name, set]) => refsOf(recordOf(set, name).sources, `${name}.sources`)),
    ),
    themes: Object.fromEntries(contexts.map(([name, refs]) => [name, load(refsOf(refs, name))])),
  };
}
