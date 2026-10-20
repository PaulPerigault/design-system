import { CODE_USAGE, messageOf } from './commands/snippet.mjs';

/**
 * Traduction des erreurs de `parseArgs` (`node:util`), dont les messages sont en anglais.
 * Le nom de l'option ou de l'argument est lu dans le premier segment entre apostrophes du message
 * d'origine ; un code inconnu, ou un message sans ce segment, garde le message d'origine.
 */

const QUOTED = /'([^']+)'/;
const MISSING_VALUE = '<value>';

/**
 * `--out` pour « -o, --out <value> » : forme longue de préférence, sans la valeur.
 * @param {string} quoted
 * @returns {string}
 */
function optionName(quoted) {
  const names = quoted.split(/[\s,]+/).filter((part) => part.startsWith('-'));
  return names.find((part) => part.startsWith('--')) ?? names[0] ?? quoted;
}

/** @type {Record<string, (quoted: string) => string>} */
const TRANSLATIONS = {
  ERR_PARSE_ARGS_UNKNOWN_OPTION: (quoted) =>
    `option inconnue : ${quoted} (un positionnel commençant par « - » se place après « -- »)`,
  ERR_PARSE_ARGS_INVALID_OPTION_VALUE: (quoted) =>
    quoted.includes(MISSING_VALUE)
      ? `valeur manquante pour ${optionName(quoted)}`
      : `${optionName(quoted)} ne prend pas de valeur`,
  ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL: (quoted) => `argument inattendu : ${quoted}`,
};

/**
 * Message français d'une erreur levée par `parseArgs`.
 * @param {unknown} error
 * @returns {string}
 */
export function parseErrorMessage(error) {
  const message = messageOf(error);
  const code = error instanceof Error && 'code' in error ? String(error.code) : '';
  const translate = Object.hasOwn(TRANSLATIONS, code) ? TRANSLATIONS[code] : undefined;
  const quoted = QUOTED.exec(message)?.[1];
  return translate && quoted ? translate(quoted) : message;
}

/**
 * Lance une commande ; une erreur qu'elle lève (paquet introuvable avec `--from`, verrou illisible)
 * devient un message sur `io.err` et le code d'usage, comme les échecs qu'elle signale elle-même.
 * @param {import('./lib/io.mjs').CreateIo} io
 * @param {() => number} task
 * @returns {number} code de sortie
 */
export function runCommand(io, task) {
  try {
    return task();
  } catch (error) {
    io.err(messageOf(error));
    return CODE_USAGE;
  }
}
