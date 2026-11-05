// Ajoute au Project 13 les PR fusionnées depuis #38, avec Début = création et Échéance = fusion
// (décision Q30, issue #290). Dry-run par défaut, `--apply` pour écrire ; idempotent : une PR déjà
// présente avec les bonnes dates n'est pas proposée. Cible et noms des champs : roadmap-dates.json.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { addItem, readProject, writeDate } from './project-dates/project-io.mjs';
import { describePulls, planPulls } from './project-pulls/plan.mjs';

const FILE = '.github/roadmap-dates.json';
const LIMIT = '1000';

const defaultIo = {
  gh: (args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 2 ** 26 }),
  read: (file) => readFileSync(file, 'utf8'),
  log: console.log,
};

const readPulls = (gh) =>
  JSON.parse(
    gh([
      'pr',
      'list',
      '--state',
      'merged',
      '--limit',
      LIMIT,
      '--json',
      'number,url,state,createdAt,mergedAt',
    ]),
  );

function applyPlan(gh, state, { target, fields, plan }) {
  const ids = new Map(state.fields.map((field) => [field.name, field.id]));
  const missing = [fields.start, fields.due].filter((name) => !ids.has(name));
  if (missing.length > 0) throw new Error(`champ absent du Project : ${missing.join(', ')}`);
  const write = (itemId, field, value) =>
    writeDate(gh, state, { itemId, fieldId: ids.get(field), value });
  for (const { url, start, due } of plan.add) {
    const itemId = addItem(gh, target, url);
    write(itemId, fields.start, start);
    write(itemId, fields.due, due);
  }
  for (const { itemId, field, value } of plan.writes) write(itemId, field, value);
}

/** @returns {{ add: object[], writes: object[] }} plan calculé (et appliqué avec `apply`) */
export function run({ apply = false, ...io } = {}) {
  const { gh, read, log } = { ...defaultIo, ...io };
  const { owner, project, fields } = JSON.parse(read(FILE));
  const target = { owner, project };
  const state = readProject(gh, target, fields);
  const plan = planPulls(readPulls(gh), state.pulls, fields);
  const lines = describePulls(plan);
  log(lines.length ? lines.join('\n') : 'Rien à faire : PR du Project à jour.');
  log(`${plan.add.length} PR à ajouter, ${plan.writes.length} date(s) à réécrire`);
  if (apply) applyPlan(gh, state, { target, fields, plan });
  log(apply ? 'appliqué' : 'dry-run : rien modifié (--apply pour écrire)');
  return plan;
}

if (import.meta.main) {
  const flags = process.argv.slice(2);
  const unknown = flags.filter((flag) => !['--apply', '--dry-run'].includes(flag));
  if (unknown.length > 0) {
    console.error(`option inconnue : ${unknown[0]}`);
    process.exit(1);
  }
  run({ apply: flags.includes('--apply') });
}
