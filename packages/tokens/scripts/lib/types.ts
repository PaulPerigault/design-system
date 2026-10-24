/** Types partagés du générateur : arbre DTCG, tokens aplatis, modèle d'émission. */

/** Nœud d'un arbre DTCG : groupe (clés libres) ou feuille (`$value`). */
export interface DtcgNode {
  [key: string]: unknown;
}

export interface Token {
  name: string;
  type: string;
  value: unknown;
}

export interface BaseEntry extends Token {
  css: string;
}

export interface ThemeEntry {
  name: string;
  oklch: string;
  hex: string;
}

export interface Model {
  base: BaseEntry[];
  themes: Record<string, ThemeEntry[]>;
}

export interface Source {
  base: DtcgNode;
  themes: Record<string, DtcgNode>;
}

export type TokenErrorCode = 'invalid-source' | 'invalid-token' | 'unsupported' | 'inconsistent';

/** Erreur du générateur : `code` littéral, `TypeError` pour rester compatible avec les appelants. */
export class TokenError extends TypeError {
  readonly code: TokenErrorCode;

  constructor(code: TokenErrorCode, message: string) {
    super(message);
    this.name = 'TokenError';
    this.code = code;
  }
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
