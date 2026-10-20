/** `tokens.d.ts` : union triée de tous les noms de variables, et `themeColor` typé. */
import { themeColors } from './emit-json.mjs';

export const DTS_HEADER =
  '// Fichier généré par scripts/build.mjs depuis src/tokens/ : ne pas éditer.';

const literal = (text) => `'${text}'`;

/** Forme de Prettier : une ligne si un seul membre, sinon un membre par ligne préfixé de `|`. */
function union(names) {
  if (names.length === 1) return ` ${literal(names[0])};`;
  const members = names.map((name) => `\n  | ${literal(name)}`);
  return `${members.join('')};`;
}

export function emitDts({ base, themes }) {
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
