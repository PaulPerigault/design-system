// Extraction des commentaires par langage : un seul passage par expression régulière qui saute
// les chaînes. Approximation assumée : un littéral d'expression régulière contenant `//` ou une
// apostrophe peut être mal lu. Aucune E/S.
const STRING_DOUBLE = String.raw`"(?:\\.|[^"\\\n])*"`;
const STRING_SINGLE = String.raw`'(?:\\.|[^'\\\n])*'`;
const TEMPLATE = String.raw`\`(?:\\.|[^\`\\])*\``;
const BLOCK = String.raw`\/\*[\s\S]*?\*\/`;
const LINE = String.raw`\/\/[^\n]*`;
const HTML = String.raw`<!--[\s\S]*?-->`;
const HASH = String.raw`(?<=^|\s)#[^\n]*`;

const SYNTAX = {
  '.ts': [STRING_DOUBLE, STRING_SINGLE, TEMPLATE, BLOCK, LINE],
  '.mjs': [STRING_DOUBLE, STRING_SINGLE, TEMPLATE, BLOCK, LINE],
  '.astro': [STRING_DOUBLE, STRING_SINGLE, TEMPLATE, HTML, BLOCK, LINE],
  '.rs': [STRING_DOUBLE, BLOCK, LINE],
  '.css': [STRING_DOUBLE, STRING_SINGLE, BLOCK],
  '.yml': [STRING_DOUBLE, STRING_SINGLE, HASH],
};

export const LANGUAGES = {
  '.ts': 'TypeScript',
  '.mjs': 'script .mjs',
  '.astro': 'Astro',
  '.rs': 'Rust',
  '.css': 'CSS',
  '.yml': 'workflow YAML',
};
export const extensionOf = (file) => file.slice(file.lastIndexOf('.'));

const COMMENT_START = /^(?:\/\/|\/\*|<!--|#)/;
const isLine = (raw) => /^(?:\/\/|#)/.test(raw);
const DOC = /^(?:\/\*\*|\/\/\/|\/\/!|\/\*!)/;

function patternFor(extension) {
  const parts = SYNTAX[extension];
  return parts ? new RegExp(parts.map((part) => `(${part})`).join('|'), 'gm') : undefined;
}

/** Texte d'un commentaire HTML, sans filtrage : l'outil mesure, il n'assainit rien. */
const unwrapHtml = (raw) =>
  raw.startsWith('<!--') ? raw.slice('<!--'.length, -'-->'.length) : raw;

const stripMarks = (raw) =>
  unwrapHtml(raw)
    .replace(/^(?:\/\/[/!]?|#)\s?/, '')
    .replace(/^\/\*+!?\s?|\s*\*+\/$/g, '')
    .replace(/^\s*\* ?/gm, '')
    .trim();

/** Fusionne les lignes `//`, `///` ou `#` consécutives en un seul commentaire. */
function mergeRuns(found) {
  const merged = [];
  for (const comment of found) {
    const last = merged.at(-1);
    const adjacent =
      last && isLine(last.raw) && isLine(comment.raw) && comment.line === last.end + 1;
    if (!adjacent) {
      merged.push({ ...comment, end: comment.line + comment.raw.split('\n').length - 1 });
      continue;
    }
    last.raw += `\n${comment.raw}`;
    last.text = `${last.text}\n${comment.text}`.trim();
    last.end = comment.line;
  }
  return merged;
}

/** @returns {{ line: number, end: number, text: string, raw: string, doc: boolean }[]} */
export function extractComments(source, extension) {
  const pattern = patternFor(extension);
  if (!pattern) return [];
  const found = [];
  for (const match of source.matchAll(pattern)) {
    if (!COMMENT_START.test(match[0])) continue;
    const line = source.slice(0, match.index).split('\n').length;
    found.push({ line, text: stripMarks(match[0]), raw: match[0], doc: DOC.test(match[0]) });
  }
  return mergeRuns(found);
}

/** Première ligne de code non vide après le commentaire (pour détecter une paraphrase). */
export function nextCodeLine(source, comment) {
  const lines = source.split('\n');
  return lines.slice(comment.end).find((t) => t.trim() && !COMMENT_START.test(t.trim())) ?? '';
}
