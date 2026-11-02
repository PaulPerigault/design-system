// Synchronise les dates « Début » et « Échéance » du Project avec .github/roadmap-dates.json.
// Dry-run par défaut, `--apply` pour écrire ; idempotent : une valeur déjà posée n'est pas réécrite.
// Alimente la vue Roadmap (docs/process/github-setup.md). Aucune création d'issue ni de PR.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { DatesError, describePlan, planDates, validateDates } from './project-dates/plan.mjs';
import { createDateField, readProject, writeDate } from './project-dates/project-io.mjs';

const FILE = '.github/roadmap-dates.json';

export const ghRun = (args) => execFileSync('gh', args, { encoding: 'utf8' });

/** @returns {{ plan: object, applied: boolean }} */
export function sync(wanted, run, { apply = false } = {}) {
  validateDates(wanted);
  const target = { owner: wanted.owner, project: wanted.project };
  let state = readProject(run, target, wanted.fields);
  const current = () => ({ fieldNames: state.fields.map((f) => f.name), items: state.items });
  const plan = planDates(wanted, current());
  if (!apply) return { plan, applied: false };
  for (const name of plan.createFields) createDateField(run, target, name);
  if (plan.createFields.length > 0) state = readProject(run, target, wanted.fields);
  const ids = new Map(state.fields.map((field) => [field.name, field.id]));
  for (const { itemId, field, value } of planDates(wanted, current()).writes) {
    writeDate(run, state, { itemId, fieldId: ids.get(field), value });
  }
  return { plan, applied: true };
}

if (import.meta.main) {
  const apply = process.argv.includes('--apply');
  try {
    const wanted = JSON.parse(readFileSync(FILE, 'utf8'));
    const { plan } = sync(wanted, ghRun, { apply });
    const lines = describePlan(plan);
    console.log(lines.length === 0 ? 'Rien à faire : dates à jour.' : lines.join('\n'));
    if (!apply && lines.length > 0) console.log('\nDry-run : relancer avec --apply pour écrire.');
  } catch (error) {
    if (!(error instanceof DatesError)) throw error;
    console.error(error.message);
    process.exit(1);
  }
}
