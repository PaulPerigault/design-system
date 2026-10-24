import { readFileSync } from 'node:fs';
import { flatten } from '../scripts/lib/flatten.ts';
import type { DtcgNode } from '../scripts/lib/types.ts';
import { isRecord, TokenError } from '../scripts/lib/types.ts';

/** Lit un fichier JSON et refuse tout ce qui n'est pas un objet. */
export function readJson(url: URL): DtcgNode {
  const data: unknown = JSON.parse(readFileSync(url, 'utf8'));
  if (!isRecord(data)) throw new TokenError('invalid-source', `${url.pathname} : objet attendu.`);
  return data;
}

export interface NamedLeaf {
  path: string;
  type: string;
  value: unknown;
}

/** Feuilles d'un arbre DTCG : chemin pointé, type (hérité du groupe) et valeur. */
export const leaves = (node: DtcgNode): NamedLeaf[] =>
  flatten(node).map((leaf) => ({ ...leaf, path: leaf.path.join('.') }));

/** Descend un chemin pointé dans un arbre ; `undefined` si un maillon manque. */
export function at(node: DtcgNode, path: string): unknown {
  let current: unknown = node;
  for (const key of path.split('.')) current = isRecord(current) ? current[key] : undefined;
  return current;
}

/** Composants d'une couleur DTCG OKLCH. */
export function componentsOf(value: unknown): { l: number; c: number; h: number } {
  const parts = isRecord(value) ? value.components : undefined;
  if (!Array.isArray(parts) || parts.some((p) => typeof p !== 'number')) {
    throw new TokenError('invalid-token', 'couleur : components attendu.');
  }
  const [l = 0, c = 0, h = 0] = parts;
  return { l, c, h };
}
