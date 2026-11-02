/** Segment d'un texte : du texte courant, ou un identifiant entre backticks. */
export interface Segment {
  code: boolean;
  text: string;
}

const BACKTICK = /`([^`]+)`/g;

/**
 * Découpe un texte aux paires de backticks (convention Markdown des JSDoc). Un backtick seul, sans
 * paire fermante, reste du texte. Fonction pure : le rendu en `<code>` appartient au composant.
 */
export const splitInlineCode = (value: string): Segment[] => {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of value.matchAll(BACKTICK)) {
    if (match.index > last) segments.push({ code: false, text: value.slice(last, match.index) });
    segments.push({ code: true, text: match[1] ?? '' });
    last = match.index + match[0].length;
  }
  if (last < value.length) segments.push({ code: false, text: value.slice(last) });
  return segments;
};
