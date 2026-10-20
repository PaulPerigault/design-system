/**
 * Lecture de la source DTCG via le resolver (DTCG Resolver 2025.10, sous-ensemble utilisé) :
 * `sets` fusionnés forment la base, chaque contexte du modificateur `theme` forme un thème.
 * Le lecteur de texte est injecté : `readText(nom)` rend le contenu d'un fichier de `src/tokens/`.
 */

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Fusion profonde : les groupes se combinent, une feuille ultérieure remplace la précédente. */
export function merge(target, source) {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const both = isPlainObject(result[key]) && isPlainObject(value) && !('$value' in value);
    result[key] = both ? merge(result[key], value) : value;
  }
  return result;
}

/** Une source peut être un nom de fichier ou une référence `{ "$ref": "fichier.json" }`. */
const sourceName = (source) => (typeof source === 'string' ? source : source.$ref);

/**
 * @param {(name: string) => string} readText
 * @returns {{ base: object, themes: Record<string, object> }}
 */
export function readSource(readText, resolverName = 'resolver.json') {
  const parse = (name) => JSON.parse(readText(name));
  const load = (sources) => sources.map(sourceName).map(parse).reduce(merge, {});
  const resolver = parse(resolverName);
  const sets = Object.values(resolver.sets ?? {});
  const contexts = Object.entries(resolver.modifiers?.theme?.contexts ?? {});
  return {
    base: load(sets.flatMap((set) => set.sources)),
    themes: Object.fromEntries(contexts.map(([name, sources]) => [name, load(sources)])),
  };
}
