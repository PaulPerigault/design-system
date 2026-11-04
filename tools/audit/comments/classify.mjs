// Classement des commentaires par les six catégories de l'audit et trois classes d'action.
// Heuristiques lexicales : elles désignent des candidats, le jugement final revient à une relecture.
const REFERENCE = /\b(?:D-\d{2,3}|ADR-?\d{4})\b/;
const CONVERSATION =
  /#\d+|\b(?:issue|PR) ?#?\d+|\bPaul\b|[Cc]onfirmé|[Dd]écidé|\bL\d{1,2}\b|\bT\d+\.\d+\b|\b20\d\d-\d\d-\d\d\b|\bétape \d/;
const DECORATIVE = /^[\s\-=*#~_/─━│┃]*$|[-=─━*#~]{4,}/;
const AI_STYLE =
  /\b(?:Note\s*:|Importantly|ensures?|Ensure|robust|seamless|leverag\w+|comprehensive|garantit|assure que|il est important|n'hésitez)\b|\p{Emoji_Presentation}/u;
const TODO = /\b(?:TODO|FIXME|HACK|XXX)\b/;
const TECHNICAL =
  /\b(?:invariant|unité|contrainte|contournement|workaround|WCAG|RFC|ISO|spec|norme|octets|bytes|px|ms|Safari|iOS|Chrome|Firefox|Windows|CRLF)\b/i;
const TAG_ONLY =
  /^@(?:param\s+(?:\{.*\}\s*)?\[?[\w.$]+\]?|returns?\s*(?:\{.*\})?|type\s*\{.*\})\s*$/;
const MIN_WORD = 4;
const OVERLAP = 0.6;

const words = (text) =>
  (text.toLowerCase().match(/[a-zà-ÿ0-9_]+/g) ?? []).filter((w) => w.length >= MIN_WORD);

/** Part des mots du commentaire qui figurent déjà dans la ligne de code qui suit. */
export function overlap(text, code) {
  const mine = words(text);
  if (mine.length === 0) return 0;
  const there = new Set(words(code));
  return mine.filter((word) => there.has(word)).length / mine.length;
}

function isRedundantDoc(comment, code) {
  if (!comment.doc) return false;
  const lines = comment.text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const tagOnly = (l) => !comment.jsdocTypes && TAG_ONLY.test(l);
  return lines.length > 0 && lines.every((l) => tagOnly(l) || overlap(l, code) >= OVERLAP);
}

const isParaphrase = (comment, code) => !comment.doc && overlap(comment.text, code) >= OVERLAP;
const hasOpenTodo = (text) => TODO.test(text) && !/#\d+/.test(text);

const RULES = [
  ['decision', (c) => CONVERSATION.test(c.text)],
  ['reference', (c) => REFERENCE.test(c.text)],
  ['decoratif', (c) => DECORATIVE.test(c.text)],
  ['doc-redondante', (c, code) => isRedundantDoc(c, code)],
  ['paraphrase', (c, code) => isParaphrase(c, code) && !isRedundantDoc(c, code)],
  ['tournure-ia', (c) => AI_STYLE.test(c.text)],
  ['todo', (c) => hasOpenTodo(c.text)],
];

/** @returns {string[]} catégories : decision, reference, decoratif, doc-redondante, paraphrase, tournure-ia, todo */
export const categories = (comment, code = '') =>
  RULES.filter(([, test]) => test(comment, code)).map(([name]) => name);

const DELETE = new Set(['decoratif', 'doc-redondante', 'paraphrase']);
const REWRITE = new Set(['decision', 'tournure-ia', 'todo']);

/** Classe d'action : supprimer, reformuler ou garder (invariant, unité, contrainte, norme…). */
export function actionOf(cats, text) {
  if (cats.some((c) => DELETE.has(c))) return 'supprimer';
  if (cats.some((c) => REWRITE.has(c))) return 'reformuler';
  return TECHNICAL.test(text) ? 'garder-technique' : 'garder';
}

const EVIDENCE = [CONVERSATION, REFERENCE, AI_STYLE, TODO];

/** Fragment qui a déclenché une catégorie (pour que la relecture voie le motif). */
export function evidence(text) {
  for (const pattern of EVIDENCE) {
    const found = text.match(pattern);
    if (found) return found[0];
  }
  return '';
}
