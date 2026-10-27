// Extraction des imports d'un fichier source (JS/TS, CSS, `.astro`), avec numéro de ligne.
import { lineOf } from '../lib/files.ts';

/** Chaque motif capture le spécificateur dans le groupe 2 (le groupe 1 est le guillemet). */
const PATTERNS = [
  /\b(?:import|export)\s+(?:type\s+)?[^'"`;]*?\bfrom\s*(['"])([^'"\n]+)\1/dg,
  /\bimport\s*(['"])([^'"\n]+)\1/dg,
  /\bimport\s*\(\s*(['"])([^'"\n]+)\1\s*\)/dg,
  /@import\s+(?:url\(\s*)?(['"]?)([^'")\s;]+)\1/dg,
];

const FRONTMATTER = /^\s*---\r?\n[\s\S]*?\r?\n---/;
const SCRIPT = /<script\b[^>]*>[\s\S]*?<\/script>/g;

/** Remplace tout sauf les sauts de ligne par des espaces : les numéros de ligne restent exacts. */
const blank = (text: string): string => text.replace(/[^\n]/g, ' ');

function astroRanges(text: string): [number, number][] {
  const spans = [FRONTMATTER.exec(text), ...text.matchAll(SCRIPT)].filter(
    (match): match is RegExpExecArray => match !== null,
  );
  return spans.map((match) => [match.index, match.index + match[0].length]);
}

function codeOfAstro(text: string): string {
  let result = '';
  let cursor = 0;
  for (const [start, end] of astroRanges(text)) {
    if (start < cursor) continue;
    result += blank(text.slice(cursor, start)) + text.slice(start, end);
    cursor = end;
  }
  return result + blank(text.slice(cursor));
}

export function importsOf(text: string, file = ''): { specifier: string; line: number }[] {
  const code = file.toLowerCase().endsWith('.astro') ? codeOfAstro(text) : text;
  const found = PATTERNS.flatMap((pattern) =>
    [...code.matchAll(pattern)].map((match) => {
      const [index] = match.indices?.[2] ?? [0, 0];
      return { specifier: match[2] ?? '', line: lineOf(code, index), index };
    }),
  );
  const unique = new Map(found.map((item) => [item.index, item]));
  return [...unique.values()]
    .sort((a, b) => a.index - b.index)
    .map(({ specifier, line }) => ({ specifier, line }));
}
