/** Objet JSON simple : ni `null`, ni tableau. */
export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Chaînes d'un objet : `true` si chaque valeur est une chaîne. */
export const isStringRecord = (value: unknown): value is Record<string, string> =>
  isPlainObject(value) && Object.values(value).every((item) => typeof item === 'string');
