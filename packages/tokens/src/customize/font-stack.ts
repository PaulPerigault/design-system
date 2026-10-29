import type { Result } from './result.ts';
import { fail, ok } from './result.ts';

/** Convention : une pile de quelques familles tient bien sous cette longueur. */
export const MAX_STACK_LENGTH = 256;

/** Ce qui sortirait d'une déclaration CSS : fin de déclaration, bloc, ressource, commentaire. */
const FORBIDDEN = /[;{}\r\n\p{Zl}\p{Zp}]|url\(|@import|\/\*|\*\//iu;
const PAIR = 2;
const QUOTES = ["'", '"'] as const;

const countOf = (text: string, char: string): number => text.split(char).length - 1;

/** Guillemets et parenthèses appariés : sinon la valeur déborde sur la déclaration suivante. */
function balanced(text: string): boolean {
  const quotes = QUOTES.every((quote) => countOf(text, quote) % PAIR === 0);
  return quotes && countOf(text, '(') === countOf(text, ')');
}

/** Pile de police du texte (`--pp-font-stack`) : liste de familles CSS, nettoyée des espaces. */
export function parseFontStack(raw: unknown): Result<string> {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (text === '') return fail('build.stack-empty', '--pp-font-stack : pile vide.');
  if (text.length > MAX_STACK_LENGTH) {
    return fail(
      'build.stack-too-long',
      `--pp-font-stack : ${text.length} caractères, ${MAX_STACK_LENGTH} au plus.`,
    );
  }
  if (FORBIDDEN.test(text) || !balanced(text)) {
    return fail('build.stack-unsafe', '--pp-font-stack : caractères hors d’une déclaration CSS.');
  }
  return ok(text);
}
