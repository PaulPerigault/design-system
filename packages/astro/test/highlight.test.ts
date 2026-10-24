import { describe, expect, it } from 'vitest';
import { LANGUAGES, categoryOf, highlight } from '../src/content/highlight';

const textOfLines = (lines: { text: string }[][]): string =>
  lines.map((line) => line.map((token) => token.text).join('')).join('\n');

describe('categoryOf', () => {
  it('extrait la catégorie d’une variable de jeton', () => {
    expect(categoryOf('var(--shiki-token-keyword)')).toBe('keyword');
    expect(categoryOf('var(--shiki-token-string-expression)')).toBe('string-expression');
  });

  it('ignore le premier plan, une valeur brute et l’absence de couleur', () => {
    expect(categoryOf('var(--shiki-foreground)')).toBeUndefined();
    expect(categoryOf('#ff0000')).toBeUndefined();
    expect(categoryOf(undefined)).toBeUndefined();
  });
});

describe('highlight', () => {
  it('colore le TypeScript avec des catégories, sans valeur de couleur brute', async () => {
    const lines = await highlight('const answer = 42;', 'ts');
    const categories = lines.flat().map((token) => token.tok);
    expect(categories).toContain('keyword');
    expect(categories).toContain('constant');
    expect(JSON.stringify(lines)).not.toMatch(/#[0-9a-f]{3,8}|rgb\(|var\(/i);
  });

  it('conserve le texte exact, ligne par ligne', async () => {
    const code = 'a {\n  color: red;\n}';
    expect(textOfLines(await highlight(code, 'css'))).toBe(code);
  });

  it('retire le saut de ligne final', async () => {
    expect(textOfLines(await highlight('x\n', 'js'))).toBe('x');
    expect(textOfLines(await highlight('x\r\n'))).toBe('x');
  });

  it.each(['', 'klingon', undefined])('langue %j : texte sans coloration', async (lang) => {
    const lines = await highlight('un\ndeux', lang);
    expect(lines).toEqual([[{ text: 'un' }], [{ text: 'deux' }]]);
  });

  it.each(LANGUAGES)('charge la langue %s', async (lang) => {
    const lines = await highlight('a', lang);
    expect(textOfLines(lines)).toBe('a');
  });

  it('accepte un code vide', async () => {
    expect(textOfLines(await highlight('', 'json'))).toBe('');
  });
});
