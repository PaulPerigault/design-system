// Lie la première occurrence de chaque terme du glossaire dans le texte d'une page construite.
// Hors code, titres, <title>, liens, boutons et légendes : un lien dans un lien ou un titre serait une faute.
import { mapText } from './html-text.mjs';

const SKIP = new Set([
  'a',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'button',
  'summary',
  'label',
  'title',
  'th',
  'dt',
]);
const GUARD = String.raw`(?<![\p{L}\p{N}_-])`;
const AFTER = String.raw`(?![\p{L}\p{N}_-])`;

/** @param {string} id ancre du glossaire @param {string[]} words formes reconnues (sensibles à la casse) */
export const term = (id, words) => ({
  id,
  re: new RegExp(`${GUARD}(?:${words.join('|')})${AFTER}`, 'u'),
});

/** @returns {{ id: string, start: number, end: number }[]} première occurrence de chaque terme non lié, sans chevauchement */
function firstMatches(text, terms, done) {
  const found = terms
    .filter((entry) => !done.has(entry.id))
    .map((entry) => ({ id: entry.id, m: entry.re.exec(text) }))
    .filter((hit) => hit.m !== null)
    .map(({ id, m }) => ({ id, start: m.index, end: m.index + m[0].length }))
    .sort((a, b) => a.start - b.start);
  return found.filter((hit, i) => i === 0 || hit.start >= found[i - 1].end);
}

function linkText(text, terms, done) {
  let out = '';
  let pos = 0;
  for (const { id, start, end } of firstMatches(text, terms, done)) {
    done.add(id);
    out += `${text.slice(pos, start)}<a href="/glossaire/#${id}">${text.slice(start, end)}</a>`;
    pos = end;
  }
  return out + text.slice(pos);
}

/** @returns {string} la page, avec un lien vers le glossaire à la première occurrence de chaque terme */
export function linkTerms(html, terms) {
  const done = new Set();
  return mapText(
    html,
    (text, kind) => (kind === 'text' ? linkText(text, terms, done) : text),
    SKIP,
  );
}
