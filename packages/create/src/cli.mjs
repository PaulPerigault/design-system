import { parseArgs } from 'node:util';
import { parseErrorMessage, runCommand } from './cli-errors.mjs';
import * as add from './commands/add.mjs';
import * as create from './commands/create.mjs';
import * as diff from './commands/diff.mjs';
import * as eject from './commands/eject.mjs';
import { loadTemplate } from './site/template.mjs';

const CODE_OK = 0;
const CODE_USAGE = 2;

const OPTIONS = {
  'dry-run': { type: 'boolean' },
  force: { type: 'boolean' },
  from: { type: 'string' },
  out: { type: 'string' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
};

/** Options propres à certaines commandes : ailleurs, elles sont refusées. */
const SCOPED = ['force', 'from', 'out'];

const COMMANDS = {
  create: { run: create.run, arg: '<dossier>', allowed: [] },
  add: { run: add.run, arg: '<élément>', allowed: ['from'] },
  eject: { run: eject.run, arg: '<élément>', allowed: ['force', 'from', 'out'] },
  diff: { run: diff.run, arg: '<élément>', allowed: ['from'] },
};

export const USAGE = [
  'usage : pp-create <commande> [options]',
  '  create <dossier>   site Astro minimal ; refuse un dossier non vide',
  '  add <élément>      ajoute @paulperigault/astro aux dépendances, affiche l’import',
  '  eject <élément>    copie les sources dans le projet et les inscrit au verrou',
  '  diff <élément>     compare la copie éjectée au paquet installé',
  '  <dossier>          raccourci de create (npm create @paulperigault <dossier>)',
  'options :',
  '  --dry-run          liste les écritures sans rien écrire',
  '  --from <dossier>   paquet astro hors node_modules (add, eject, diff)',
  `  --out <dossier>    dossier cible d’eject (défaut : ${eject.DEFAULT_OUT})`,
  '  --force            eject : écrase les copies et l’entrée du verrou',
  '  -h, --help         affiche cette aide',
  '  -v, --version      affiche la version',
  'exemple : npx @paulperigault/create eject stack',
].join('\n');

/** Message puis usage sur `io.err`. @returns {number} code d'usage */
function usageError(io, message) {
  io.err(`pp-create : ${message}`);
  io.err(USAGE);
  return CODE_USAGE;
}

/**
 * Commande et positionnels : un premier positionnel inconnu et seul vaut `create <dossier>`.
 * @param {string[]} positionals
 * @returns {{ name: string, rest: string[] } | { error: string }}
 */
function resolveCommand(positionals) {
  const [first, ...rest] = positionals;
  if (first === undefined) return { error: 'commande manquante' };
  if (Object.hasOwn(COMMANDS, first)) return { name: first, rest };
  if (rest.length === 0) return { name: 'create', rest: positionals };
  return { error: `commande inconnue : ${first}` };
}

/**
 * Message d'erreur d'usage propre à la commande, ou `null` si l'appel est valide.
 * @param {string} name
 * @param {string[]} rest
 * @param {Record<string, unknown>} values
 * @returns {string | null}
 */
function invalidCall(name, rest, values) {
  const { arg, allowed } = COMMANDS[name];
  if (rest.length !== 1) return `${name} : argument ${arg} ${rest.length ? 'en trop' : 'manquant'}`;
  const refused = SCOPED.find((key) => values[key] !== undefined && !allowed.includes(key));
  return refused ? `--${refused} ne s’applique pas à ${name}` : null;
}

/**
 * Point d'entrée de `pp-create`.
 * @param {string[]} argv arguments, sans `node` ni le script
 * @param {{ io: import('./lib/io.mjs').CreateIo, templatesRoot: string, version: string }} ctx
 * @returns {number} code de sortie
 */
export function main(argv, { io, templatesRoot, version }) {
  let parsed;
  try {
    parsed = parseArgs({ args: argv, options: OPTIONS, strict: true, allowPositionals: true });
  } catch (error) {
    return usageError(io, parseErrorMessage(error));
  }
  const { values, positionals } = parsed;
  if (values.help || values.version) {
    io.out(values.help ? USAGE : version);
    return CODE_OK;
  }
  const command = resolveCommand(positionals);
  if ('error' in command) return usageError(io, command.error);
  const invalid = invalidCall(command.name, command.rest, values);
  if (invalid) return usageError(io, invalid);
  return dispatch(command, values, { io, templatesRoot });
}

/**
 * Lance la commande ; seul `create` charge le gabarit. Une erreur levée par la commande vaut 2.
 * @param {{ name: string, rest: string[] }} command
 * @param {Record<string, string | boolean | undefined>} values
 * @param {{ io: import('./lib/io.mjs').CreateIo, templatesRoot: string }} ctx
 * @returns {number} code de sortie
 */
function dispatch({ name, rest }, values, { io, templatesRoot }) {
  const template = name === 'create' ? loadTemplate(io, templatesRoot) : undefined;
  const { force, from, out } = values;
  const options = { positionals: rest, dryRun: values['dry-run'] === true, force, from, out };
  return runCommand(io, () => COMMANDS[name].run(options, { io, template }));
}
