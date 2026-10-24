import { SITE_NAME, TITLE_SUFFIX } from '../src/lib/site.ts';

/**
 * Mise en page du texte des images Open Graph (logique pure, sans mesure de police) :
 * retour à la ligne par nombre de caractères, troncature au mot avec « … ».
 */

const ELLIPSIS = '…';
const TRAILING = /[\s,;:.\-–—·]+$/u;
const TITLE_SEPARATOR = ' · ';

/** Titre affiché : le suffixe commun du site est retiré ; l'accueil prend le nom du site. */
export function imageTitleOf(title) {
  const tail = `${TITLE_SEPARATOR}${TITLE_SUFFIX}`;
  if (title === TITLE_SUFFIX) return SITE_NAME;
  return title.endsWith(tail) ? title.slice(0, -tail.length) : title;
}

/** Un mot plus long qu'une ligne est coupé en tronçons de `maxChars`. */
function chunkWord(word, maxChars) {
  const chunks = [];
  for (let start = 0; start < word.length; start += maxChars) {
    chunks.push(word.slice(start, start + maxChars));
  }
  return chunks;
}

function breakLines(words, maxChars) {
  const lines = [];
  let current = '';
  for (const word of words.flatMap((entry) => chunkWord(entry, maxChars))) {
    if (current && current.length + 1 + word.length <= maxChars) {
      current = `${current} ${word}`;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Raccourcit une ligne au mot près pour que `ligne + …` tienne dans `maxChars`. */
export function ellipsize(line, maxChars) {
  let kept = line.replace(TRAILING, '');
  while (kept.length + ELLIPSIS.length > maxChars) {
    const cut = kept.lastIndexOf(' ');
    kept = (cut > 0 ? kept.slice(0, cut) : kept.slice(0, maxChars - ELLIPSIS.length)).replace(
      TRAILING,
      '',
    );
  }
  return `${kept}${ELLIPSIS}`;
}

/** Lignes d'au plus `maxChars` caractères, `maxLines` lignes au plus (dernière tronquée). */
export function wrapText(text, maxChars, maxLines) {
  const lines = breakLines(text.split(/\s+/u).filter(Boolean), maxChars);
  if (lines.length <= maxLines) return lines;
  return [
    ...lines.slice(0, maxLines - 1),
    ellipsize(lines.slice(maxLines - 1).join(' '), maxChars),
  ];
}
