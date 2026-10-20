// Routage des modèles par palier (models.json) et escalade : un échec fait monter d'un palier,
// jamais deux fois au même ; après `hard`, la tâche revient à l'orchestrateur (null).

/**
 * @param {{ tiers: Record<string, { model: string }> }} models contenu de models.json
 * @param {string} tier palier demandé
 * @returns {string} identifiant de modèle Kiro
 */
export function modelFor(models, tier) {
  const entry = models.tiers[tier];
  if (!entry) throw new Error(`Palier inconnu : ${tier}`);
  return entry.model;
}

/** Palier suivant dans l'ordre d'escalade, ou null s'il n'y en a plus. */
export function nextTier(models, tier) {
  const order = models.escalation;
  const index = order.indexOf(tier);
  if (index === -1) return null;
  return order[index + 1] ?? null;
}

/** Paliers essayés pour une tâche partant de `tier`, escalade comprise (au plus `max`). */
export function tierPlan(models, tier, max = models.escalation.length) {
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

/** Entrée du journal de routage (une ligne JSON). */
export function routingEntry({ task, tier, model, engine, reason, result, credits, now }) {
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
