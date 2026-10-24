/** `tokens.d.ts` : union triée de tous les noms de variables, et `themeColor` typé. */
import type { Model } from './types.ts';
import { themeColors } from './emit-json.ts';

export const DTS_HEADER =
  '// Fichier généré par scripts/build.ts depuis src/tokens/ : ne pas éditer.';

const literal = (text: string): string => `'${text}'`;

/** Forme de Prettier : une ligne si un seul membre, sinon un membre par ligne préfixé de `|`. */
function union(names: string[]): string {
  const [only] = names;
  if (names.length === 1 && only !== undefined) return ` ${literal(only)};`;
  const members = names.map((name) => `\n  | ${literal(name)}`);
  return `${members.join('')};`;
}

export function emitDts({ base, themes }: Model): string {
  const all = [...base, ...Object.values(themes).flat()].map((token) => token.name);
  const names = [...new Set(all)].sort();
  const colors = Object.entries(themeColors(themes));
  const fields = colors.map(([theme, hex]) => `readonly ${theme}: ${literal(hex)}`);
  const lines = [
    DTS_HEADER,
    `export type TokenName =${union(names)}`,
    '',
    `export declare const themeColor: { ${fields.join('; ')} };`,
  ];
  return `${lines.join('\n')}\n`;
}
