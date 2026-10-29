// Prompt envoyé à l'exécutant : énoncé de la tâche, fichiers autorisés, commandes d'acceptation,
// et, en cas de relance, l'erreur de la tentative précédente. Jamais d'historique de conversation.

import type { Task } from './types.ts';

const bullets = (items: string[]): string => items.map((item) => `- ${item}`).join('\n');

export function buildPrompt(
  task: Pick<Task, 'id' | 'title' | 'body' | 'files' | 'acceptance'>,
  {
    previousFailure = null,
    role = 'worker',
  }: { previousFailure?: string | null | undefined; role?: 'worker' | 'reviewer' } = {},
): string {
  const sections = [
    `# Tâche ${task.id} — ${task.title}`,
    role === 'reviewer'
      ? 'Rôle : relecteur en lecture seule. Ne modifie aucun fichier.'
      : 'Rôle : exécutant. Lis AGENTS.md avant de commencer ; il prime sur tout le reste.',
    task.body,
    `## Fichiers autorisés (exclusifs)\n\n${bullets(task.files)}\n\nTout autre fichier créé, modifié ou supprimé fait échouer la tâche sans revue.`,
    `## Acceptation (à lancer toi-même jusqu'à ce que tout passe)\n\n${bullets(task.acceptance)}`,
    '## Interdits\n\nAucun commit, push, changement de branche, publication npm, installation de dépendance, accès réseau, sous-agent.',
  ];
  if (previousFailure) {
    sections.push(`## Tentative précédente : échec à corriger\n\n${previousFailure}`);
  }
  sections.push(
    role === 'reviewer'
      ? '## Réponse\n\nPremière ligne : APPROUVÉ ou CHANGEMENTS REQUIS, puis `fichier:ligne — problème — correction`.'
      : '## Compte rendu final\n\nFichiers modifiés, résultat de chaque commande d’acceptation, 3 lignes « ce qui reste incertain ».',
  );
  return sections.join('\n\n');
}
