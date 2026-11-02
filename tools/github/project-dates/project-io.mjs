// Lecture et écriture du Project via `gh` (exécuteur injecté : testable sans réseau).
const MAX_ITEMS = '500';

const json = (run, args) => JSON.parse(run(args));
const key = (name) => name.toLowerCase();

/** @returns {{ projectId: string, fields: { id: string, name: string }[], items: Map<number, object> }} */
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
  const items = new Map();
  for (const item of list.items) {
    if (item.content?.type !== 'Issue') continue;
    items.set(item.content.number, {
      itemId: item.id,
      start: item[key(names.start)],
      due: item[key(names.due)],
    });
  }
  return { projectId: view.id, fields, items };
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
