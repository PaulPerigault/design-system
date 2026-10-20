import { resolveIn } from './io.mjs';

/** @typedef {{ path: string, content: string, overwrite?: boolean }} PlanEntry */

const CODE_OK = 0;
const CODE_CONFLICT = 1;

/**
 * Applique un plan d'écriture.
 * @param {import('./io.mjs').CreateIo} io
 * @param {PlanEntry[]} plan
 * @param {{ dryRun?: boolean, force?: boolean }} [options]
 * @returns {number} code de sortie
 */
export function applyPlan(io, plan, { dryRun = false, force = false } = {}) {
  const existing = new Set(
    plan.filter((entry) => io.exists(resolveIn(io, entry.path))).map((entry) => entry.path),
  );
  const conflicts = plan.filter(
    (entry) => existing.has(entry.path) && entry.overwrite !== true && !force,
  );
  if (conflicts.length > 0) {
    conflicts.forEach((entry) => io.err(`conflit : ${entry.path} existe déjà`));
    return CODE_CONFLICT;
  }
  for (const entry of plan) {
    if (dryRun) {
      io.out(`${existing.has(entry.path) ? 'écraserait' : 'créerait'} ${entry.path}`);
      continue;
    }
    io.writeText(resolveIn(io, entry.path), entry.content);
    io.out(`écrit ${entry.path}`);
  }
  return CODE_OK;
}
