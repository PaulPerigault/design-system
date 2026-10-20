/**
 * Aplatissement d'un arbre DTCG : une entrée par token, `$type` hérité du groupe le plus proche.
 * Nom CSS : `--pp-` + chemin joint par `-` (`font.size.-1` → `--pp-font-size--1`).
 */

const SEGMENT = /^[a-z0-9-]+$/i;

export function tokenName(path) {
  const invalid = path.find((segment) => !SEGMENT.test(segment));
  if (invalid !== undefined) throw new TypeError(`tokenName : segment « ${invalid} » invalide.`);
  return `--pp-${path.join('-')}`;
}

/** Tri par point de code : indépendant de la locale, donc déterministe. */
export const byName = (a, b) => {
  if (a.name === b.name) return 0;
  return a.name < b.name ? -1 : 1;
};

/** @returns {{ path: string[], type: string, value: unknown }[]} feuilles dans l'ordre source */
export function flatten(node, path = [], inheritedType = undefined) {
  const type = node.$type ?? inheritedType;
  if ('$value' in node) {
    if (type === undefined) throw new TypeError(`flatten : ${path.join('.')} sans $type.`);
    return [{ path, type, value: node.$value }];
  }
  return Object.keys(node)
    .filter((key) => !key.startsWith('$'))
    .flatMap((key) => flatten(node[key], [...path, key], type));
}

/** @returns {{ name: string, type: string, value: unknown }[]} triées par nom */
export function entries(tree) {
  return flatten(tree)
    .map(({ path, type, value }) => ({ name: tokenName(path), type, value }))
    .sort(byName);
}
