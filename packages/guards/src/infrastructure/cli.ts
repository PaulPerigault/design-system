// pp-guards <contrôle> [options] [racines…] : dispatch, configuration, codes de sortie.
import { parseArgs } from 'node:util';
import type { Check, CliOptions } from '../application/check.ts';
import type { GuardIo } from '../application/ports.ts';
import { CHECKS, ORDER } from './checks.ts';
import { loadConfig, mergeOptions } from '../application/config.ts';
import type { Options } from '../domain/options.ts';
import { GuardUsageError } from '../errors.ts';

const EXIT_OK = 0;
const EXIT_USAGE = 2;
const COMMON: CliOptions = {
  config: { type: 'string' as const },
  help: { type: 'boolean' as const },
};

/** Chemin `--config` : une chaîne, ou rien. */
const configPath = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

/** Erreur de syntaxe de ligne de commande : le message est suivi de l'usage. */
const syntaxError = (message: string): Error & { showUsage: boolean } =>
  Object.assign(new GuardUsageError(message), { showUsage: true });

export function usageText(check?: Check): string {
  if (check === undefined) {
    return [
      'usage : pp-guards <contrôle> [options] [racines…]',
      `contrôles : ${[...ORDER, 'all'].join(', ')}`,
      '  --config <fichier>   configuration (défaut : pp-guards.config.json)',
      '  --help               cette aide, ou celle du contrôle',
    ].join('\n');
  }
  const flags = Object.entries(check?.cliOptions ?? {}).map(([flag, spec]) =>
    spec.multiple ? `  --${flag} <valeur>   (répétable)` : `  --${flag} <valeur>`,
  );
  const head = `usage : pp-guards ${check.name} [options] [racines…]`;
  return [head, ...flags, '  --config <fichier>', '  --help'].join('\n');
}

function parse(args: string[], options: CliOptions, allowPositionals: boolean) {
  try {
    return parseArgs({ args, options, allowPositionals, strict: true });
  } catch (error: unknown) {
    if (error instanceof Error) throw syntaxError(error.message);
    throw syntaxError(String(error));
  }
}

/** Un contrôle qui échoue (usage, configuration) rend 2 sans interrompre `all`. */
function runChecked(check: Check, options: Options, io: GuardIo): number {
  try {
    return check.run(options, io);
  } catch (error: unknown) {
    if (error instanceof Error) io.err(error.message);
    return EXIT_USAGE;
  }
}

function runOne(check: Check, args: string[], io: GuardIo): number {
  const { values, positionals } = parse(args, { ...COMMON, ...check.cliOptions }, true);
  if (values.help === true) {
    io.out(usageText(check));
    return EXIT_OK;
  }
  const flags = Object.fromEntries(
    Object.entries(values).filter(([flag]) => !Object.hasOwn(COMMON, flag)),
  );
  const section = loadConfig(io, configPath(values.config))[check.name];
  return check.run(mergeOptions(check.defaults, section, flags, positionals), io);
}

function runAll(args: string[], io: GuardIo): number {
  const { values } = parse(args, COMMON, false);
  if (values.help === true) {
    io.out(usageText());
    return EXIT_OK;
  }
  const config = loadConfig(io, configPath(values.config));
  const names = ORDER.filter((name) => config[name] !== undefined);
  if (names.length === 0) throw new GuardUsageError('all : aucune section de contrôle trouvée');
  const codes = names.map((name) => {
    const check = CHECKS[name];
    if (!check) return EXIT_USAGE;
    return runChecked(check, mergeOptions(check.defaults, config[name], {}, []), io);
  });
  return Math.max(...codes);
}

function dispatch(first: string, rest: string[], io: GuardIo): number {
  if (first === 'all') return runAll(rest, io);
  if (!Object.hasOwn(CHECKS, first)) throw syntaxError(`contrôle inconnu : ${first}`);
  const check = CHECKS[first];
  if (!check) throw syntaxError(`contrôle inconnu : ${first}`);
  return runOne(check, rest, io);
}

export function main(argv: string[], io: GuardIo): number {
  const [first, ...rest] = argv;
  if (first === '--help' || first === '-h') {
    io.out(usageText());
    return EXIT_OK;
  }
  try {
    if (first === undefined) throw syntaxError('contrôle manquant');
    return dispatch(first, rest, io);
  } catch (error: unknown) {
    if (error instanceof Error) {
      io.err(error.message);
      if ('showUsage' in error && error.showUsage) io.err(usageText());
    }
    return EXIT_USAGE;
  }
}
