import { parseArgs } from 'node:util';
import { parseErrorMessage, runCommand } from './cli-errors.ts';
import { DEFAULT_OUT } from './commands/eject.ts';
import { COMMANDS, invalidCall, resolveCommand } from './commands/table.ts';
import type { CommandName } from './commands/table.ts';
import type { CreateIo } from './lib/io.ts';
import { loadTemplate } from './site/template.ts';

const CODE_OK = 0;
const CODE_USAGE = 2;

const OPTIONS = {
  'dry-run': { type: 'boolean' },
  force: { type: 'boolean' },
  from: { type: 'string' },
  out: { type: 'string' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
} as const;

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
  `  --out <dossier>    dossier cible d’eject (défaut : ${DEFAULT_OUT})`,
  '  --force            eject : écrase les copies et l’entrée du verrou',
  '  -h, --help         affiche cette aide',
  '  -v, --version      affiche la version',
  'exemple : npx @paulperigault/create eject stack',
].join('\n');

/** Message puis usage sur `io.err` ; rend le code d'usage. */
function usageError(io: CreateIo, message: string): number {
  io.err(`pp-create : ${message}`);
  io.err(USAGE);
  return CODE_USAGE;
}

/** Lance la commande ; seul `create` charge le gabarit. Une erreur levée par la commande vaut 2. */
function dispatch(
  { name, rest }: { name: CommandName; rest: string[] },
  values: { 'dry-run'?: boolean | undefined; force?: boolean | undefined } & {
    from?: string | undefined;
    out?: string | undefined;
  },
  { io, templatesRoot }: { io: CreateIo; templatesRoot: string },
): number {
  const template = name === 'create' ? loadTemplate(io, templatesRoot) : undefined;
  const { force, from, out } = values;
  const options = { positionals: rest, dryRun: values['dry-run'] === true, force, from, out };
  return runCommand(io, () => COMMANDS[name].run(options, { io, template }));
}

export interface MainContext {
  io: CreateIo;
  templatesRoot: string;
  version: string;
}

/** Point d'entrée de `pp-create` ; `argv` sans `node` ni le script. Rend le code de sortie. */
export function main(argv: string[], { io, templatesRoot, version }: MainContext): number {
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
