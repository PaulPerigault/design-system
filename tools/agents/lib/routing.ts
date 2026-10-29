// Routage des modèles par palier (models.json) et escalade : un échec fait monter d'un palier,
// jamais deux fois au même ; après `hard`, la tâche revient à l'orchestrateur (null).
import type { Models, Task } from './types.ts';

/** `models` : contenu de models.json ; rend l'identifiant de modèle Kiro du palier. */
export function modelFor(models: Pick<Models, 'tiers'>, tier: string): string {
  const entry = models.tiers[tier];
  if (!entry) throw new Error(`Palier inconnu : ${tier}`);
  return entry.model;
}

/** Palier suivant dans l'ordre d'escalade, ou null s'il n'y en a plus. */
export function nextTier(models: Pick<Models, 'escalation'>, tier: string): string | null {
  const order = models.escalation;
  const index = order.indexOf(tier);
  if (index === -1) return null;
  return order[index + 1] ?? null;
}

/** Paliers essayés pour une tâche partant de `tier`, escalade comprise (au plus `max`). */
export function tierPlan(
  models: Pick<Models, 'escalation'>,
  tier: string,
  max = models.escalation.length,
): string[] {
  const plan = [tier];
  for (
    let next = nextTier(models, tier);
    next && plan.length < max;
    next = nextTier(models, next)
  ) {
    plan.push(next);
  }
  return plan;
}

export interface RoutingInput {
  task: Pick<Task, 'id' | 'title'>;
  tier: string;
  model?: string | undefined;
  engine: string;
  reason: string;
  result: string;
  credits?: number | undefined;
  now: Date;
}

/** Entrée du journal de routage (une ligne JSON). */
export function routingEntry({
  task,
  tier,
  model,
  engine,
  reason,
  result,
  credits,
  now,
}: RoutingInput) {
  return {
    at: now.toISOString(),
    task: task.id,
    title: task.title,
    engine,
    tier,
    model,
    reason,
    result,
    credits: credits ?? null,
  };
}

/** Raison pour laquelle le moteur est indisponible (`config.kiro.available: false`), sinon null. */
export const unavailableEngine = (
  deps: { config: { kiro?: { available?: boolean; reason?: string } } },
  engine: string,
): string | null =>
  engine === 'kiro' && deps.config.kiro?.available === false
    ? `Kiro ${deps.config.kiro.reason}`
    : null;
