// Outil validate_snippet : l'analyse est celle du domaine, `analyze` (guards) est injecté.
import { validateSnippet } from '../domain/snippet.ts';
import type { SnippetDeps } from '../domain/snippet.ts';
import { defineTool } from './tool.ts';
import type { Tool } from './tool.ts';

export function snippetTools(deps: SnippetDeps): Tool[] {
  return [
    defineTool({
      name: 'validate_snippet',
      title: 'Valider un extrait',
      description:
        'Analyse statique d’un extrait astro, html, css ou md (jamais exécuté) avec les ' +
        'garde-fous du design system : interdits de conception, jetons --pp-* inconnus, ' +
        'style en ligne, images sans dimensions. Chaque violation porte la règle, la ligne, ' +
        'un message et une correction proposée.',
      run: (input) => validateSnippet(input, deps),
    }),
  ];
}
