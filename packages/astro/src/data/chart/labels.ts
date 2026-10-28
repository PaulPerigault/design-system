/** Libellé de catégorie mis en forme : lignes affichées, texte complet, troncature. */
export interface FittedLabel {
  readonly lines: readonly string[];
  readonly full: string;
  readonly truncated: boolean;
}

const ELLIPSIS = '…';

const clip = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1))}${ELLIPSIS}`;

/** Remplissage glouton des lignes de `max` caractères : un mot trop long reste seul sur sa ligne. */
function greedy(words: readonly string[], max: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current === '' ? word : `${current} ${word}`;
    if (current === '' || next.length <= max) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  return current === '' ? lines : [...lines, current];
}

/**
 * Retour à la ligne puis troncature : au plus `maxLines` lignes de `maxChars` caractères, la
 * dernière finit par « … » si le texte déborde ; `truncated` dit qu'il faut le texte complet.
 */
export function fitLabel(text: string, maxChars: number, maxLines: number): FittedLabel {
  const full = text.trim().replace(/\s+/g, ' ');
  const lines = greedy(full.split(' '), maxChars);
  const kept = lines.slice(0, maxLines).map((line) => clip(line, maxChars));
  if (lines.length > maxLines)
    kept[maxLines - 1] = clip(lines.slice(maxLines - 1).join(' '), maxChars);
  return { lines: kept, full, truncated: kept.join(' ') !== full };
}
