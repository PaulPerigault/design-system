/** Lecture pure des ADR (`docs/adr/*.md`) : identifiant, titre, statut, résumé, description. */

const SUMMARY_MAX = 200;
const DESCRIPTION_MAX = 160;
const ADR_BASENAME = /^(\d{4})-/;
const TITLE_LINE = /^# (ADR-\d{4} — .+?)\s*$/m;
const STATUS_PREFIX = '- Statut : ';
const STATUS_LEAD = /^- Statut :\s*/;
const CONTINUATION = /^ {2}\S/;
const CONTEXT_HEADING = /^## Contexte\b/;
const TRAILING_COLON = /\s*:$/;
const TRAILING_DOT = /\.$/;
const OWNER_MENTION = /\b(nous|propriétaire|Paul)\b/i;

export interface AdrEntry {
  id: string;
  title: string;
  status: string;
  summary: string;
  href: string;
}

/** Retire les marques Markdown simples (code, gras) et compacte les espaces. */
export const plain = (text: string): string =>
  text
    .replace(/`|\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Coupe au dernier espace avant `max`, avec une ellipse. Le résultat ne dépasse jamais `max`. */
export function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const end = cut.lastIndexOf(' ');
  return `${cut.slice(0, end > 0 ? end : cut.length).trimEnd()}…`;
}

/** `0003-mcp.md` → `0003`. Lève une erreur si le nom ne commence pas par quatre chiffres. */
export function adrId(filename: string): string {
  const base = filename.split('/').at(-1) ?? filename;
  const id = ADR_BASENAME.exec(base)?.[1];
  if (id === undefined) throw new Error(`Nom d’ADR invalide : ${filename}`);
  return id;
}

/** Première ligne `# ADR-… — …`, sans le dièse. */
export function adrTitle(markdown: string): string {
  const title = TITLE_LINE.exec(markdown)?.[1];
  if (title === undefined) throw new Error('Titre ADR absent : attendu « # ADR-… — … »');
  return plain(title);
}

/** Ligne `- Statut : …`, prolongée par les lignes indentées qui suivent. */
export function adrStatus(markdown: string): string {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.startsWith(STATUS_PREFIX));
  if (start === -1) throw new Error('Statut ADR absent : attendu « - Statut : … »');
  const parts: string[] = [];
  for (const line of lines.slice(start)) {
    if (parts.length > 0 && !CONTINUATION.test(line)) break;
    parts.push(line);
  }
  return plain(parts.join(' ')).replace(STATUS_LEAD, '');
}

/** Premier paragraphe de la section « Contexte », sans Markdown, en 200 caractères au plus. */
export function summary(markdown: string): string {
  const lines = markdown.split('\n');
  const heading = lines.findIndex((line) => CONTEXT_HEADING.test(line.trim()));
  if (heading === -1) throw new Error('Section « ## Contexte » absente');
  const body = lines
    .slice(heading + 1)
    .join('\n')
    .trimStart();
  const paragraph = body.split(/\n\s*\n/)[0] ?? '';
  return clip(plain(paragraph).replace(TRAILING_COLON, '.'), SUMMARY_MAX);
}

/** Description de page : statut puis résumé, en 160 caractères au plus. */
export function descriptionOf(markdown: string): string {
  const status = adrStatus(markdown).replace(TRAILING_DOT, '');
  return clip(`Statut : ${status}. ${summary(markdown)}`, DESCRIPTION_MAX);
}

/** Vrai si le texte parle à la première personne ou du propriétaire : il est alors un brouillon. */
export const isDraft = (markdown: string): boolean => OWNER_MENTION.test(markdown);

/** Entrée de liste : identifiant, titre, statut, résumé et chemin de la page. */
export function adrEntry(filename: string, markdown: string): AdrEntry {
  const id = adrId(filename);
  return {
    id,
    title: adrTitle(markdown),
    status: adrStatus(markdown),
    summary: summary(markdown),
    href: `/decisions/${id}/`,
  };
}

export const byId = (a: AdrEntry, b: AdrEntry): number => a.id.localeCompare(b.id);
