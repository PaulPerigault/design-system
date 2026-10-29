import { isPlainObject } from './json.ts';
import type { PlanEntry } from './plan.ts';
import { PACKAGE_NAME } from './registry.ts';

/**
 * Réécriture du `package.json` du projet : insertion de la dépendance, en gardant la forme.
 */

export const MANIFEST = 'package.json';
const INDENT_PATTERN = /^([ \t]+)"/m;
const CRLF = '\r\n';

export interface Manifest {
  text: string;
  data: Record<string, unknown>;
}

const objectField = (data: Record<string, unknown>, field: string): Record<string, unknown> => {
  const value = data[field];
  return isPlainObject(value) ? value : {};
};

/** Dépendances avec le paquet inséré à sa place alphabétique, ordre des autres clés conservé. */
function insertDependency(deps: Record<string, unknown>, version: string): Record<string, unknown> {
  const entries = Object.entries(deps);
  const at = entries.findIndex(([name]) => name > PACKAGE_NAME);
  entries.splice(at === -1 ? entries.length : at, 0, [PACKAGE_NAME, version]);
  return Object.fromEntries(entries);
}

/** Sérialise comme l'original : indentation (aucune si minifié), fin de ligne, retour final. */
function serializeLike(original: string, data: unknown): string {
  const indent = INDENT_PATTERN.exec(original)?.[1];
  const json = JSON.stringify(data, null, indent);
  const eol = original.includes(CRLF) ? CRLF : '\n';
  const body = json.replaceAll('\n', eol);
  return original.endsWith('\n') ? `${body}${eol}` : body;
}

/** Plan d'écriture du manifeste : vide si le paquet y figure déjà. `version` : version exacte. */
export function dependencyPlan({ text, data }: Manifest, version: string): PlanEntry[] {
  const has = (field: string): boolean => Object.hasOwn(objectField(data, field), PACKAGE_NAME);
  if (has('dependencies') || has('devDependencies')) return [];
  const dependencies = insertDependency(objectField(data, 'dependencies'), version);
  const content = serializeLike(text, { ...data, dependencies });
  return [{ path: MANIFEST, content, overwrite: true }];
}
