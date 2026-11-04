// Mesure des commentaires de code (lecture seule) : comptes par paquet, dossier, langage et catégorie.
// `node tools/audit/measure-comments.mjs [--samples N]` ; le résultat est déterministe.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { actionOf, categories, evidence } from './comments/classify.mjs';
import { LANGUAGES, extensionOf, extractComments, nextCodeLine } from './comments/extract.mjs';

const SKIP = /^(?:apps\/docs\/e2e\/references|tasks|\.agents)\//;
const SEGMENTS = { packages: 2, apps: 2, crates: 2, tools: 2, '.github': 2 };
const DEFAULT_SAMPLES = 30;

export function scopeOf(file) {
  const parts = file.split('/');
  return parts.slice(0, SEGMENTS[parts[0]] ?? 1).join('/');
}

/** @returns {object[]} une ligne par commentaire : fichier, ligne, langage, portée, catégories, action. */
export function collect(files, readText) {
  const rows = [];
  for (const file of files) {
    const extension = extensionOf(file);
    if (!LANGUAGES[extension] || SKIP.test(file)) continue;
    const source = readText(file);
    for (const comment of extractComments(source, extension)) {
      const typed = { ...comment, jsdocTypes: extension === '.mjs' }; // en .mjs, le JSDoc porte les types
      const cats = categories(typed, nextCodeLine(source, comment));
      const test = /\.test\.|\/e2e\/|\/tests\//.test(file);
      const base = { file, line: comment.line, scope: scopeOf(file), test };
      rows.push({
        ...base,
        language: LANGUAGES[extension],
        text: comment.text,
        why: evidence(comment.text),
        cats,
        action: actionOf(cats, comment.text),
      });
    }
  }
  return rows;
}

export function tally(rows, pick) {
  const table = new Map();
  for (const row of rows) {
    const entry = table.get(pick(row)) ?? { total: 0 };
    entry.total += 1;
    for (const key of [...row.cats, row.action]) entry[key] = (entry[key] ?? 0) + 1;
    table.set(pick(row), entry);
  }
  return table;
}

/** Échantillon régulier (un commentaire sur k) : déterministe, sans tirage. */
export function sample(rows, pick, size) {
  const match = typeof pick === 'string' ? (row) => row.action === pick : pick;
  const pool = rows.filter(match);
  const step = Math.max(1, Math.floor(pool.length / size));
  return pool.filter((_, index) => index % step === 0).slice(0, size);
}

const flat = (text) => text.slice(0, 110).replaceAll('\n', ' ');
const describe = (r) =>
  `- ${r.file}:${r.line} [${r.cats.join(',')}${r.why ? `: ${r.why}` : ''}] ${flat(r.text)}`;

function render(title, table) {
  const keys = ['total', 'supprimer', 'reformuler', 'garder-technique', 'garder'];
  const extra = [
    'decision',
    'reference',
    'paraphrase',
    'decoratif',
    'doc-redondante',
    'tournure-ia',
    'todo',
  ];
  const head = [title, ...keys, ...extra].join(' | ');
  const lines = [head, head.replace(/[^|]/g, '-')];
  for (const [name, entry] of [...table].sort((a, b) => b[1].total - a[1].total)) {
    lines.push([name, ...[...keys, ...extra].map((key) => entry[key] ?? 0)].join(' | '));
  }
  return lines.join('\n');
}

if (import.meta.main) {
  const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const rows = collect(files, (file) => readFileSync(file, 'utf8'));
  const wanted = process.argv.indexOf('--samples');
  const size = wanted > 0 ? Number(process.argv[wanted + 1] ?? DEFAULT_SAMPLES) : 0;
  console.log(
    `Commentaires : ${rows.length} (dont ${rows.filter((r) => r.test).length} dans des tests)\n`,
  );
  console.log(
    render(
      'Portée',
      tally(rows, (r) => r.scope),
    ),
    '\n',
  );
  console.log(
    render(
      'Langage',
      tally(rows, (r) => r.language),
    ),
  );
  const classes = [
    ['supprimer', 'supprimer'],
    ['reformuler', 'reformuler'],
    ['garder-technique', 'garder-technique'],
    ['references D-xxx et ADR (⚖️)', (row) => row.cats.includes('reference')],
  ];
  for (const [title, pick] of size ? classes : []) {
    console.log(`
### ${title}`);
    for (const r of sample(rows, pick, size)) console.log(describe(r));
  }
}
