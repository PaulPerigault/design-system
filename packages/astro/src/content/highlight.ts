import { createCssVariablesTheme, createHighlighter } from 'shiki';

/** Langages chargés (liste fermée) : toute autre langue donne du texte sans coloration. */
export const LANGUAGES = [
  'ts',
  'js',
  'json',
  'shellscript',
  'astro',
  'css',
  'html',
  'yaml',
] as const;

/** Un fragment de code : `tok` est la catégorie de jeton (`keyword`…), absente pour le texte nu. */
export interface Token {
  text: string;
  tok?: string | undefined;
}

const THEME_NAME = 'pp-code';
const VARIABLE = /^var\(--shiki-token-([a-z-]+)\)$/;
const LINE_BREAK = /\r?\n/;
const TRAILING_BREAK = /\r?\n$/;

const theme = createCssVariablesTheme({ name: THEME_NAME, fontStyle: false });

type Highlighter = Awaited<ReturnType<typeof createHighlighter>>;
let highlighter: Promise<Highlighter> | undefined;

const load = (): Promise<Highlighter> =>
  (highlighter ??= createHighlighter({ themes: [theme], langs: [...LANGUAGES] }));

const isKnown = (lang: string | undefined): lang is (typeof LANGUAGES)[number] =>
  lang !== undefined && (LANGUAGES as readonly string[]).includes(lang);

/** `var(--shiki-token-keyword)` devient `keyword` ; toute autre couleur (premier plan) devient rien. */
export const categoryOf = (color: string | undefined): string | undefined =>
  color === undefined ? undefined : VARIABLE.exec(color)?.[1];

const plain = (code: string): Token[][] => code.split(LINE_BREAK).map((text) => [{ text }]);

/**
 * Colore `code` au build. Renvoie les lignes de fragments, sans saut de ligne final. La couleur
 * Shiki est une variable CSS : elle est convertie en `data-tok` (aucun attribut `style`, CSP stricte).
 */
export async function highlight(code: string, lang?: string): Promise<Token[][]> {
  const source = code.replace(TRAILING_BREAK, '');
  if (!isKnown(lang)) return plain(source);
  const { tokens } = (await load()).codeToTokens(source, { lang, theme });
  return tokens.map((line) =>
    line.map(({ content, color }) => ({ text: content, tok: categoryOf(color) })),
  );
}
