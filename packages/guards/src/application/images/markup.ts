// Balisage d'image brut : `<img` et `background(-image): … url(` hors des chemins permis.
// `<Image`, `<Picture` et le `src: url()` d'une police ne sont pas visés. Les commentaires
// sont remplacés par des espaces, sauts de ligne conservés, avant la recherche.
import { lineOf } from '../../domain/text.ts';
import type { GuardIo } from '../ports.ts';
import { matchesAny } from '../../domain/paths.ts';
import type { Problem } from '../../domain/problem.ts';

const IMG_EXTENSIONS = ['.astro', '.html', '.md', '.mdx', '.jsx', '.tsx'];
const BACKGROUND_EXTENSIONS = ['.css', '.astro'];
export const MARKUP_EXTENSIONS = [...new Set([...IMG_EXTENSIONS, ...BACKGROUND_EXTENSIONS])];

const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const STYLE_BLOCK = /<style\b[\s\S]*?<\/style\s*>/gi;
const JSX_COMMENT = /\{\s*\/\*[\s\S]*?\*\/\s*\}/g;
const JSX_EXTENSIONS = ['.jsx', '.tsx', '.mdx'];
const RAW_IMG = /<img(?=[\s/>])/gi;
const BACKGROUND_URL = /(?<![\w-])(background(?:-image)?)\s*:[^;{}]*?url\(/gi;

const extensionOf = (file: string): string => file.slice(file.lastIndexOf('.')).toLowerCase();

const blank = (match: string): string => match.replace(/[^\n]/g, ' ');

export function neutralizeComments(text: string, extension = ''): string {
  if (extension === '.css') return text.replace(BLOCK_COMMENT, blank);
  const plain = text.replace(HTML_COMMENT, blank);
  const styled = plain.replace(STYLE_BLOCK, (block) => block.replace(BLOCK_COMMENT, blank));
  return JSX_EXTENSIONS.includes(extension) ? styled.replace(JSX_COMMENT, blank) : styled;
}

export function rawImages(text: string, extension: string): { index: number; label: string }[] {
  const found: { index: number; label: string }[] = [];
  if (IMG_EXTENSIONS.includes(extension)) {
    for (const match of text.matchAll(RAW_IMG))
      found.push({ index: match.index ?? 0, label: '<img> brut' });
  }
  if (BACKGROUND_EXTENSIONS.includes(extension)) {
    for (const match of text.matchAll(BACKGROUND_URL)) {
      found.push({ index: match.index ?? 0, label: `${(match[1] ?? '').toLowerCase()}: url(` });
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

export function markupProblems(io: GuardIo, files: string[], allow: string[]): Problem[] {
  const outside = allow.length > 0 ? ` hors ${allow.join(', ')}` : '';
  return files
    .filter((file) => !matchesAny(file, allow))
    .flatMap((file) => {
      const extension = extensionOf(file);
      const text = neutralizeComments(io.readText(file), extension);
      return rawImages(text, extension).map(({ index, label }) => ({
        file,
        line: lineOf(text, index),
        message: `${label} interdit${outside} : utiliser Photo`,
      }));
    });
}
