/** Résultat Pagefind tel que renvoyé par `result.data()` (champs utilisés seulement). */
export interface RawResult {
  url: string;
  meta?: { title?: string };
  excerpt: string;
}

export interface SearchResult {
  url: string;
  title: string;
  /** Texte échappé ; seules les balises `<mark>` subsistent. */
  excerpt: string;
}

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Échappe le HTML d'un texte. */
export const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);

/** Inverse d'`escapeHtml`, pour ne pas échapper deux fois un extrait que Pagefind a déjà échappé. */
const unescapeHtml = (text: string): string =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&');

/**
 * Phrase annoncée par la zone `role="status"`. La requête est échappée : le texte est destiné à
 * `innerHTML`, l'analyseur HTML restitue ensuite les caractères d'origine au lecteur d'écran.
 */
export function summary(count: number, query: string): string {
  const quoted = `« ${escapeHtml(query)} »`;
  if (count < 1) return `Aucun résultat pour ${quoted}`;
  return `${count} ${count > 1 ? 'résultats' : 'résultat'} pour ${quoted}`;
}

/** Ne garde que le texte et les `<mark>` : toute autre balise est rendue inerte. */
function safeExcerpt(raw: string): string {
  return raw
    .split(/(<\/?mark>)/i)
    .map((part) =>
      /^<\/?mark>$/i.test(part) ? part.toLowerCase() : escapeHtml(unescapeHtml(part)),
    )
    .join('');
}

/** Résultat Pagefind → `{ url, title, excerpt }` prêt à afficher. */
export function normalize(raw: RawResult): SearchResult {
  const title = raw.meta?.title?.trim();
  return { url: raw.url, title: title || raw.url, excerpt: safeExcerpt(raw.excerpt) };
}
