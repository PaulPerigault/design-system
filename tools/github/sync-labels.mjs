// Synchronise les labels du dépôt avec .github/labels.json (dry-run par défaut, --apply pour agir).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const LABELS_FILE = '.github/labels.json';
const NAME_PATTERN = /^[a-z0-9:-]+( [a-z0-9:-]+)?$/;
const COLOR_PATTERN = /^[0-9a-f]{6}$/;
const DESCRIPTION_MAX = 100;
const ENDPOINT = 'repos/{owner}/{repo}/labels';

export class LabelSyncError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'LabelSyncError';
    this.code = code;
  }
}

const key = (name) => name.toLowerCase();

const RULES = [
  [({ name }) => !NAME_PATTERN.test(name), 'nom hors [a-z0-9:-] (un espace admis)'],
  [({ color }) => !COLOR_PATTERN.test(color), 'couleur hors hexadécimal à 6 chiffres'],
  [({ description = '' }) => description.length > DESCRIPTION_MAX, 'description trop longue'],
];

/** Lève `LabelSyncError('invalid-labels')` si la liste voulue ne respecte pas le format. */
export function validateLabels(labels) {
  const seen = new Set();
  for (const label of labels) {
    const rule = RULES.find(([broken]) => broken(label));
    const problem = rule?.[1] ?? (seen.has(label.name) ? 'nom en double' : null);
    if (problem) throw new LabelSyncError('invalid-labels', `${label.name} : ${problem}`);
    seen.add(label.name);
  }
}

const unchanged = (a, b) =>
  a.color.toLowerCase() === b.color.toLowerCase() &&
  (a.description ?? '') === (b.description ?? '');

/** Calcule les créations, mises à jour et suppressions qui amènent `existing` à `desired`. */
export function planLabels(desired, existing) {
  const current = new Map(existing.map((l) => [key(l.name), l]));
  const wanted = new Set(desired.map((l) => key(l.name)));
  const known = (l) => current.has(key(l.name));
  return {
    create: desired.filter((l) => !known(l)),
    update: desired.filter((l) => known(l) && !unchanged(l, current.get(key(l.name)))),
    remove: existing.filter((l) => !wanted.has(key(l.name))),
  };
}

export function describePlan({ create, update, remove }) {
  return [
    ...create.map((l) => `+ ${l.name}`),
    ...update.map((l) => `~ ${l.name}`),
    ...remove.map((l) => `- ${l.name}`),
  ];
}

const fields = (l) => ['-f', `color=${l.color}`, '-f', `description=${l.description ?? ''}`];
const labelPath = (name) => `${ENDPOINT}/${encodeURIComponent(name)}`;

/** Arguments `gh api` qui réalisent un plan, un tableau par appel. */
export function planCalls({ create, update, remove }) {
  return [
    ...create.map((l) => ['-X', 'POST', ENDPOINT, '-f', `name=${l.name}`, ...fields(l)]),
    ...update.map((l) => ['-X', 'PATCH', labelPath(l.name), ...fields(l)]),
    ...remove.map((l) => ['-X', 'DELETE', labelPath(l.name)]),
  ];
}

function gh(args, exec) {
  try {
    return exec('gh', ['api', ...args], { encoding: 'utf8' });
  } catch (error) {
    throw new LabelSyncError('gh-failed', `gh api ${args.join(' ')} : ${error.message}`);
  }
}

function listLabels(exec) {
  const query = ['--paginate', `${ENDPOINT}?per_page=100`, '--jq', '.[]|{name,color,description}'];
  const out = gh(query, exec);
  return out
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const defaultIo = { exec: execFileSync, read: readFileSync, log: console.log };

export function run({ apply = false, ...io } = {}) {
  const { exec, read, log } = { ...defaultIo, ...io };
  const desired = JSON.parse(read(LABELS_FILE, 'utf8'));
  validateLabels(desired);
  const plan = planLabels(desired, listLabels(exec));
  const lines = describePlan(plan);
  log(lines.length ? lines.join('\n') : 'labels : déjà synchronisés');
  if (apply) planCalls(plan).forEach((call) => gh(call, exec));
  log(apply ? 'appliqué' : 'dry-run : rien modifié (--apply pour agir)');
  return plan;
}

if (import.meta.main) {
  const flags = process.argv.slice(2);
  const unknown = flags.filter((f) => !['--apply', '--dry-run'].includes(f));
  try {
    if (unknown.length) throw new LabelSyncError('usage', `option inconnue : ${unknown[0]}`);
    run({ apply: flags.includes('--apply') });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
