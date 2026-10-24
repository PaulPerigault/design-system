/**
 * Aplatissement d'un arbre DTCG : une entrée par token, `$type` hérité du groupe le plus proche.
 * Nom CSS : `--pp-` + chemin joint par `-` (`font.size.-1` → `--pp-font-size--1`).
 */

import type { DtcgNode, Token } from './types.ts';
import { isRecord, TokenError } from './types.ts';

const SEGMENT = /^[a-z0-9-]+$/i;

export function tokenName(path: readonly string[]): string {
  const invalid = path.find((segment) => !SEGMENT.test(segment));
  if (invalid !== undefined)
    throw new TokenError('invalid-token', `tokenName : segment « ${invalid} » invalide.`);
  return `--pp-${path.join('-')}`;
}

/** Tri par point de code : indépendant de la locale, donc déterministe. */
export const byName = (a: { name: string }, b: { name: string }): number => {
  if (a.name === b.name) return 0;
  return a.name < b.name ? -1 : 1;
};

export interface Leaf {
  path: string[];
  type: string;
  value: unknown;
}

/** Feuilles dans l'ordre source. */
export function flatten(node: DtcgNode, path: string[] = [], inheritedType?: string): Leaf[] {
  const type = typeof node.$type === 'string' ? node.$type : inheritedType;
  if ('$value' in node) {
    if (type === undefined)
      throw new TokenError('invalid-token', `flatten : ${path.join('.')} sans $type.`);
    return [{ path, type, value: node.$value }];
  }
  return Object.keys(node)
    .filter((key) => !key.startsWith('$'))
    .flatMap((key) => {
      const child = node[key];
      if (!isRecord(child)) {
        throw new TokenError(
          'invalid-source',
          `flatten : ${[...path, key].join('.')} n'est pas un objet.`,
        );
      }
      return flatten(child, [...path, key], type);
    });
}

/** Tokens triés par nom. */
export function entries(tree: DtcgNode): Token[] {
  return flatten(tree)
    .map(({ path, type, value }) => ({ name: tokenName(path), type, value }))
    .sort(byName);
}
