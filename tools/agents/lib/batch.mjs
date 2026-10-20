// Logique pure d'un lot : tâches du lot (préfixe d'identifiant `T<n>.`), tâches prêtes (toutes
// leurs dépendances intégrées), exécution avec au plus N tâches en parallèle.

/** Tâches d'un lot `L<n>` parmi toutes les tâches lues. */
export const tasksOfLot = (tasks, lot) => {
  const prefix = `T${lot.replace(/^L/i, '')}.`;
  return tasks
    .filter((task) => task.id.startsWith(prefix))
    .sort((a, b) => a.id.localeCompare(b.id));
};

/** Sépare les tâches prêtes (dépendances toutes dans `integrated`) des tâches en attente. */
export function readyTasks(tasks, integrated) {
  const done = new Set(integrated);
  const pending = tasks.filter((task) => !done.has(task.id));
  const ready = pending.filter((task) => task.depends_on.every((id) => done.has(id)));
  return { ready, waiting: pending.filter((task) => !ready.includes(task)) };
}

/**
 * Exécute `worker(item)` sur chaque élément, au plus `limit` à la fois ; résultats dans l'ordre.
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<R>} worker
 * @returns {Promise<R[]>}
 */
export async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const lane = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  return results;
}

/** Tableau Markdown récapitulatif d'un lot. */
export function batchTable(results, waiting) {
  const rows = results.map(
    (r) =>
      `| ${r.id} | ${r.status} | ${r.engine}/${r.model} | ${r.credits ?? 'n/d'} | ${r.failure ?? ''} |`,
  );
  const pending = waiting.map(
    (task) => `| ${task.id} | en attente | | | dépend de ${task.depends_on.join(', ')} |`,
  );
  return [
    '| Tâche | Statut | Modèle | Crédits | Détail |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    ...pending,
  ].join('\n');
}
