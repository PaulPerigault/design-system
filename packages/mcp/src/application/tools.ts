// Les sept outils, assemblés avec leurs dépendances injectées (données, analyse).
import type { SnippetDeps } from '../domain/snippet.ts';
import type { Data } from '../domain/types.ts';
import { componentTools } from './tools-components.ts';
import { docsTools } from './tools-docs.ts';
import { snippetTools } from './tools-snippet.ts';
import { tokenTools } from './tools-tokens.ts';
import type { Tool } from './tool.ts';

export interface ToolDeps {
  data: Data;
  analyze: SnippetDeps['analyze'];
  ruleIds: readonly string[];
}

const uniqueNames = (data: Data): string[] =>
  [
    ...new Set([
      ...Object.keys(data.tokens.themes.light),
      ...Object.keys(data.tokens.themes.dark),
      ...Object.keys(data.tokens.base),
    ]),
  ].sort();

/** Définitions des outils (nom, titre, description, traitement). */
export function toolList({ data, analyze, ruleIds }: ToolDeps): Tool[] {
  const tokenNames = uniqueNames(data);
  return [
    ...componentTools(data),
    ...tokenTools(data),
    ...snippetTools({ analyze, ruleIds, tokenNames }),
    ...docsTools(data),
  ];
}
