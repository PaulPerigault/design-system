// Logique pure d'un lot : tâches du lot (préfixe d'identifiant `T<n>.`), tâches prêtes (toutes
// leurs dépendances intégrées), exécution avec au plus N tâches en parallèle.
import type { Task, TaskResult } from './types.ts';

/** Tâches d'un lot `L<n>` parmi toutes les tâches lues. */
export const tasksOfLot = (tasks: Task[], lot: string): Task[] => {
  const prefix = `T${lot.replace(/^L/i, '')}.`;
  return tasks
    .filter((task) => task.id.startsWith(prefix))
    .sort((a, b) => a.id.localeCompare(b.id));
};

/** Sépare les tâches prêtes (dépendances toutes dans `integrated`) des tâches en attente. */
export function readyTasks(
  tasks: Task[],
  integrated: string[],
): { ready: Task[]; waiting: Task[] } {
  const done = new Set(integrated);
  const pending = tasks.filter((task) => !done.has(task.id));
  const ready = pending.filter((task) => task.depends_on.every((id) => done.has(id)));
  return { ready, waiting: pending.filter((task) => !ready.includes(task)) };
}

/** Exécute `worker(item)` sur chaque élément, au plus `limit` à la fois ; résultats dans l'ordre. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let next = 0;
  const lane = async (): Promise<void> => {
    while (next < items.length) {
      const index = next;
      next += 1;
      const item = items[index];
      if (item !== undefined) results[index] = await worker(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  return results;
}

/** Tableau Markdown récapitulatif d'un lot. */
export function batchTable(
  results: Pick<TaskResult, 'id' | 'status' | 'engine' | 'model' | 'credits' | 'failure'>[],
  waiting: Pick<Task, 'id' | 'depends_on'>[],
): string {
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
