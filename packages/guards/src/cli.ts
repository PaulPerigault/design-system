// pp-guards <contrôle> [options] [racines…] : dispatch, configuration, codes de sortie.
import { parseArgs } from 'node:util';
import { CHECKS, ORDER } from './checks.ts';
import { loadConfig, mergeOptions } from './config.ts';
import { GuardUsageError } from './lib/report.ts';

const EXIT_OK = 0;
const EXIT_USAGE = 2;
const COMMON = { config: { type: 'string' }, help: { type: 'boolean' } };

/** Erreur de syntaxe de ligne de commande : le message est suivi de l'usage. */
const syntaxError = (message) => Object.assign(new GuardUsageError(message), { showUsage: true });

/** @param {{ name: string, cliOptions: object } | undefined} check */
export function usageText(check) {
  if (check === undefined) {
    return [
      'usage : pp-guards <contrôle> [options] [racines…]',
      `contrôles : ${[...ORDER, 'all'].join(', ')}`,
      '  --config <fichier>   configuration (défaut : pp-guards.config.json)',
      '  --help               cette aide, ou celle du contrôle',
    ].join('\n');
  }
  const flags = Object.entries(check.cliOptions).map(([flag, spec]) =>
    spec.multiple ? `  --${flag} <valeur>   (répétable)` : `  --${flag} <valeur>`,
  );
  const head = `usage : pp-guards ${check.name} [options] [racines…]`;
  return [head, ...flags, '  --config <fichier>', '  --help'].join('\n');
}

/** @param {string[]} args @param {object} options @param {boolean} allowPositionals */
function parse(args, options, allowPositionals) {
  try {
    return parseArgs({ args, options, allowPositionals, strict: true });
  } catch (error) {
    throw syntaxError(error.message);
  }
}

/** Un contrôle qui échoue (usage, configuration) rend 2 sans interrompre `all`. */
function runChecked(check, options, io) {
  try {
    return check.run(options, io);
  } catch (error) {
    io.err(error.message);
    return EXIT_USAGE;
  }
}

function runOne(check, args, io) {
  const { values, positionals } = parse(args, { ...COMMON, ...check.cliOptions }, true);
  if (values.help) {
    io.out(usageText(check));
    return EXIT_OK;
  }
  const flags = Object.fromEntries(
    Object.entries(values).filter(([flag]) => !Object.hasOwn(COMMON, flag)),
  );
  const section = loadConfig(io, values.config)[check.name];
  return check.run(mergeOptions(check.defaults, section, flags, positionals), io);
}

function runAll(args, io) {
  const { values } = parse(args, COMMON, false);
  if (values.help) {
    io.out(usageText());
    return EXIT_OK;
  }
  const config = loadConfig(io, values.config);
  const names = ORDER.filter((name) => config[name] !== undefined);
  if (names.length === 0) throw new GuardUsageError('all : aucune section de contrôle trouvée');
  const codes = names.map((name) => {
    const check = CHECKS[name];
    return runChecked(check, mergeOptions(check.defaults, config[name], {}, []), io);
  });
  return Math.max(...codes);
}

function dispatch(first, rest, io) {
  if (first === 'all') return runAll(rest, io);
  if (!Object.hasOwn(CHECKS, first)) throw syntaxError(`contrôle inconnu : ${first}`);
  return runOne(CHECKS[first], rest, io);
}

/**
 * @param {string[]} argv arguments après `node pp-guards`
 * @param {import('./lib/io.ts').GuardIo} io
 * @returns {number} code de sortie : 0 ok, 1 problèmes, 2 usage ou configuration
 */
export function main(argv, io) {
  const [first, ...rest] = argv;
  if (first === '--help' || first === '-h') {
    io.out(usageText());
    return EXIT_OK;
  }
  try {
    if (first === undefined) throw syntaxError('contrôle manquant');
    return dispatch(first, rest, io);
  } catch (error) {
    io.err(error.message);
    if (error.showUsage) io.err(usageText());
    return EXIT_USAGE;
  }
}
