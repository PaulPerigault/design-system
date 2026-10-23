// Lecture pure des pages Markdown produites par apps/docs/scripts/markdown.mjs (en-tête
// `# Titre · …` et `Source :`, sections `##` et `###`, listes, tableaux, blocs de code), des
// ADR (`docs/adr/0003-mcp.md`) et des lignes `| D-… |` du journal des décisions.
const SOURCE = /^Source : (\S+)$/m;
const FENCE = /^```[^\n]*\n([\s\S]*?)\n```$/gm;
const ADR_FILE = /^(\d{4})-[\w-]+\.md$/;
const DECISION_ROW = /^\| D-\d+ /;
const PROP_COLUMNS = 4;
const SECTIONS = Object.freeze({
  summary: 'À quoi il sert',
  use: "Quand l'utiliser",
  avoid: "Quand ne pas l'utiliser",
  examples: 'Exemples',
  a11y: 'Accessibilité',
  props: 'Propriétés',
  tokens: 'Jetons utilisés',
  evidence: 'Preuves et décisions',
});
const A11Y = Object.freeze({
  keyboard: 'Clavier',
  screenReader: "Lecteur d'écran",
  guaranteed: 'Garanti par le composant',
  integrator: "À la charge de l'intégrateur",
});

/** Apostrophe typographique ramenée à l'apostrophe droite (titres comparables). */
const plain = (text) => text.replaceAll('’', "'").trim();
const lines = (text = '') => text.split('\n');

/**
 * Corps des sections aux titres connus (`marker` : `##` ou `###`) ; un titre inconnu, comme
 * celui d'un exemple de contenu, reste dans la section en cours.
 */
export function splitHeadings(text, marker, known) {
  const wanted = new Set(known.map(plain));
  const sections = new Map();
  let current;
  for (const line of lines(text)) {
    const title = line.startsWith(`${marker} `) ? plain(line.slice(marker.length + 1)) : '';
    if (wanted.has(title)) sections.set(title, (current = []));
    else current?.push(line);
  }
  return new Map([...sections].map(([title, body]) => [title, body.join('\n').trim()]));
}

export const bullets = (body) =>
  lines(body)
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim());

/** Cellules d'une ligne de tableau Markdown ; `\|` est un trait littéral. */
export const splitRow = (line) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replaceAll('\\|', '|'));

const props = (body) =>
  lines(body)
    .filter((line) => line.startsWith('|') && !/^\|\s*-/.test(line))
    .map(splitRow)
    .filter((cells) => cells.length === PROP_COLUMNS && cells[0] !== 'Propriété')
    .map(([name, type, fallback, description]) => ({ name, type, fallback, description }));

/** En-tête d'une page : titre (avant « · »), adresse source, corps après la ligne Source. */
export function pageMeta(md) {
  const title = md.split('\n', 1)[0].replace(/^# /, '').split(' · ')[0].trim();
  const source = SOURCE.exec(md);
  const body = source ? md.slice(source.index + source[0].length).trim() : md.trim();
  return { title, url: source?.[1] ?? '', body };
}

const paragraphs = (body = '') => body.replace(/\s+/g, ' ').trim();
// Le gabarit place le code source de l'exemple après les démonstrations : dernier bloc.
const snippetOf = (body = '') => [...body.matchAll(FENCE)].at(-1)?.[1] ?? '';

/** Page Markdown d'un composant → fiche structurée ; `slug` : nom du fichier sans extension. */
export function parseComponent(slug, md) {
  const { title, body } = pageMeta(md);
  const sections = splitHeadings(body, '##', Object.values(SECTIONS));
  const section = (key) => sections.get(plain(SECTIONS[key]));
  const a11y = splitHeadings(section('a11y') ?? '', '###', Object.values(A11Y));
  return {
    slug,
    title,
    summary: paragraphs(section('summary')),
    use: bullets(section('use')),
    avoid: bullets(section('avoid')),
    snippet: snippetOf(section('examples')),
    a11y: Object.fromEntries(
      Object.entries(A11Y).map(([key, heading]) => [key, bullets(a11y.get(plain(heading)))]),
    ),
    props: props(section('props')),
    tokens: bullets(section('tokens')).map((item) => item.replaceAll('`', '')),
    evidence: bullets(section('evidence')),
  };
}

/** `0003-mcp.md` → `ADR-0003`, titre après « — » ; `undefined` hors ADR. */
export function parseAdr(name, text) {
  const number = ADR_FILE.exec(name)?.[1];
  if (!number) return undefined;
  return { id: `ADR-${number}`, title: lines(text)[0].replace(/^# /, '').split(' — ').pop(), text };
}

/** Lignes `| D-… |` du journal des décisions. */
export const parseDecisionLog = (text) =>
  lines(text)
    .filter((line) => DECISION_ROW.test(line))
    .map(splitRow)
    .map(([id, date, decision, alternative, rollback]) => ({
      id,
      date,
      decision,
      alternative,
      rollback,
    }));
