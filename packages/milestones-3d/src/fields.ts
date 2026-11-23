// Contrôles d'un champ du contrat de données : date, lien, identifiant, code. Fonctions pures.
import { MAX_CODE_LENGTH } from './constants.ts';

const DATE = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/;
const ID = /^[a-z0-9-]+$/;
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const BACKSLASH = '\\';
/** Codes de contrôle et espace (jusqu'à 0x20) et DEL : interdits dans un lien. */
const LAST_CONTROL = 0x20;
const DEL = 0x7f;
const MONTHS = 12;

export const isId = (value: string): boolean => ID.test(value);

/** `AAAA-MM` ou `AAAA-MM-JJ`, avec un mois et un jour qui existent. */
export function isDate(value: string): boolean {
  const match = DATE.exec(value);
  if (!match) return false;
  const [, year = '', month = '', day] = match;
  const monthNumber = Number(month);
  if (monthNumber < 1 || monthNumber > MONTHS) return false;
  if (day === undefined) return true;
  const last = new Date(Date.UTC(Number(year), monthNumber, 0)).getUTCDate();
  return Number(day) >= 1 && Number(day) <= last;
}

function hasControl(value: string): boolean {
  return [...value].some((char) => {
    const code = char.codePointAt(0) ?? 0;
    return code <= LAST_CONTROL || code === DEL;
  });
}

/** Code court : texte simple, `MAX_CODE_LENGTH` caractères au plus, sans caractère de contrôle. */
export function isCode(value: string): boolean {
  const chars = [...value];
  const control = chars.some((char) => {
    const code = char.codePointAt(0) ?? 0;
    return code < LAST_CONTROL || code === DEL;
  });
  return chars.length <= MAX_CODE_LENGTH && !control;
}

/** Dimension facultative d'un badge : entier strictement positif. */
export const isDimension = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

/**
 * Lien accepté : `https:` absolu, ou chemin relatif (`/a`, `./a`, `../a`, `a/b`). Refusés : tout
 * autre schéma (`javascript:`, `data:`, `http:`), `//hôte`, barre oblique inverse, espaces et
 * caractères de contrôle.
 */
export function isHref(value: string): boolean {
  if (value === '' || value.includes(BACKSLASH) || hasControl(value)) return false;
  if (SCHEME.test(value)) return URL.canParse(value) && new URL(value).protocol === 'https:';
  return !value.startsWith('//');
}
