// Jetons que la scène lit sur la page : chacun doit exister dans `tokens.json` (liste fermée
// `THEME_TOKENS` du paquet 3D). Texte pur : le nom d'un jeton absent est signalé avec sa ligne.
import { isRecord } from '../options.ts';
import { lineOf } from '../text.ts';

const TOKEN = /['"`](--pp-[a-z0-9-]*[a-z0-9])['"`]/g;

/** Noms de `tokens.json` : valeurs de base et rôles de chaque thème. */
export function knownTokenNames(json: unknown): Set<string> {
  if (!isRecord(json)) return new Set();
  const themes = isRecord(json.themes) ? Object.values(json.themes) : [];
  const groups = [json.base, ...themes].filter(isRecord);
  return new Set(groups.flatMap((group) => Object.keys(group)));
}

export interface UnknownToken {
  name: string;
  line: number;
}

/** Jetons cités entre guillemets dans `text` qui ne figurent pas dans `known`. */
export function unknownThemeTokens(text: string, known: ReadonlySet<string>): UnknownToken[] {
  return [...text.matchAll(TOKEN)].flatMap((match) => {
    const name = match[1] ?? '';
    return known.has(name) ? [] : [{ name, line: lineOf(text, match.index) }];
  });
}
