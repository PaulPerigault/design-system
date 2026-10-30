// Erreurs typées de `mcp` : un code littéral par cas, le message tel que montré au client.
// Aucune erreur anonyme ne franchit une frontière de couche (ADR-0006, décision 1).

export type ToolErrorCode =
  | 'input.refused'
  | 'input.query-short'
  | 'component.unknown'
  | 'component.group-unknown'
  | 'token.unknown'
  | 'token.not-color'
  | 'token.role-unknown'
  | 'color.gamut'
  | 'color.unreadable'
  | 'decision.unknown';

export type DataErrorCode = 'data.absent' | 'data.unreadable' | 'data.invalid';

/** Erreur attendue (entrée inconnue, couleur hors gamut…) : message montré tel quel. */
export class ToolError extends Error {
  readonly code: ToolErrorCode;

  constructor(message: string, code: ToolErrorCode = 'input.refused') {
    super(message);
    this.name = 'ToolError';
    this.code = code;
  }
}

/** Données embarquées absentes, illisibles ou invalides : le message ne cite aucun chemin. */
export class DataError extends Error {
  readonly code: DataErrorCode;

  constructor(code: DataErrorCode, message: string) {
    super(message);
    this.name = 'DataError';
    this.code = code;
  }
}

export type McpError = ToolError | DataError;
