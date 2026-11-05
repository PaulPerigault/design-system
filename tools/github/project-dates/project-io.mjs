// Lecture et écriture du Project via `gh` (exécuteur injecté : testable sans réseau).
// `gh project item-list` abîme l'initiale « É » de la clé (`��chéance`) : lecture par nom normalisé.
import { field } from '../traceability/issue-rules.mjs';

const MAX_ITEMS = '500';

const json = (run, args) => JSON.parse(run(args));

/** @returns {{ projectId: string, fields: object[], items: Map<number, object>, pulls: Map<number, object> }} */
export function readProject(run, { owner, project }, names) {
  const base = [owner && '--owner', owner].filter(Boolean);
  const view = json(run, ['project', 'view', String(project), ...base, '--format', 'json']);
  const fields = json(run, [
    'project',
    'field-list',
    String(project),
    ...base,
    '--format',
    'json',
  ]).fields;
  const list = json(run, [
    'project',
    'item-list',
    String(project),
    ...base,
    '--limit',
    MAX_ITEMS,
    '--format',
    'json',
  ]);
  const pulls = index(list.items, 'PullRequest', names);
  return { projectId: view.id, fields, items: index(list.items, 'Issue', names), pulls };
}

/** Éléments d'un type (`Issue`, `PullRequest`) par numéro : identifiant et dates lues. */
export function index(items, type, names) {
  const found = new Map();
  for (const item of items) {
    if (item.content?.type !== type) continue;
    found.set(item.content.number, {
      itemId: item.id,
      start: field(item, names.start),
      due: field(item, names.due),
    });
  }
  return found;
}

/** Crée un champ de date ; `gh project field-create` est idempotent seulement si le nom manque. */
export function createDateField(run, { owner, project }, name) {
  run([
    'project',
    'field-create',
    String(project),
    '--owner',
    owner,
    '--name',
    name,
    '--data-type',
    'DATE',
  ]);
}

/** Écrit une date sur un élément. */
export function writeDate(run, { projectId }, { itemId, fieldId, value }) {
  run([
    'project',
    'item-edit',
    '--id',
    itemId,
    '--project-id',
    projectId,
    '--field-id',
    fieldId,
    '--date',
    value,
  ]);
}

/** Ajoute une PR (ou une issue) au Project ; rend l'identifiant de l'élément créé. */
export function addItem(run, { owner, project }, url) {
  const args = ['project', 'item-add', String(project), '--owner', owner, '--url', url];
  return JSON.parse(run([...args, '--format', 'json'])).id;
}
