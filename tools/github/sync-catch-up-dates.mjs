// Dates factuelles des issues de rattrapage #42 à #66 (décision Q23, issue #290) : celles des PR
// citées par docs/history/catch-up.md. Dry-run par défaut ; `--apply` réécrit seulement
// .github/roadmap-dates.json, puis `sync-project-dates.mjs --apply` pose les dates dans le Project.
// Idempotent : une entrée déjà juste n'est pas proposée. Lecture GitHub par `gh` injecté.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { applyCatchUp, describeCatchUp, planCatchUp } from './catch-up-dates/plan.mjs';
import { validateDates } from './project-dates/plan.mjs';

const FILE = '.github/roadmap-dates.json';
const CATCH_UP = 'docs/history/catch-up.md';
const LIMIT = '1000';
const INDENT = 2;

const defaultIo = {
  gh: (args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 2 ** 26 }),
  read: (file) => readFileSync(file, 'utf8'),
  write: (file, text) => writeFileSync(file, text),
  log: console.log,
};

function readGitHub(gh) {
  const list = (kind, fields) =>
    JSON.parse(gh([kind, 'list', '--state', 'all', '--limit', LIMIT, '--json', fields]));
  return {
    issues: list('issue', 'number,title'),
    pulls: list('pr', 'number,createdAt,mergedAt'),
  };
}

/** @returns {{ changes: object[], skipped: object[] }} plan calculé (et appliqué avec `apply`) */
export function run({ apply = false, ...io } = {}) {
  const { gh, read, write, log } = { ...defaultIo, ...io };
  const file = JSON.parse(read(FILE));
  const plan = planCatchUp(file, { ...readGitHub(gh), catchUp: read(CATCH_UP) });
  const lines = describeCatchUp(plan);
  log(lines.length ? lines.join('\n') : 'Rien à faire : dates de rattrapage à jour.');
  log(`${plan.changes.length} entrée(s) à réécrire, ${plan.skipped.length} laissée(s) telle(s)`);
  if (apply && plan.changes.length > 0) {
    const next = applyCatchUp(file, plan.changes);
    validateDates(next);
    write(FILE, `${JSON.stringify(next, null, INDENT)}\n`);
  }
  log(apply ? `appliqué : ${FILE}` : 'dry-run : rien modifié (--apply pour écrire le fichier)');
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
