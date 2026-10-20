// Prompt envoyé à l'exécutant : énoncé de la tâche, fichiers autorisés, commandes d'acceptation,
// et, en cas de relance, l'erreur de la tentative précédente. Jamais d'historique de conversation.

const bullets = (items) => items.map((item) => `- ${item}`).join('\n');

/**
 * @param {{ id: string, title: string, body: string, files: string[], acceptance: string[] }} task
 * @param {{ previousFailure?: string | null, role?: 'worker' | 'reviewer' }} [options]
 * @returns {string}
 */
export function buildPrompt(task, { previousFailure = null, role = 'worker' } = {}) {
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
