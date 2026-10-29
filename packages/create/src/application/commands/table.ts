import type { SiteTemplate } from '../../domain/template.ts';
import type { CreateIo, ThemeBuilder } from '../ports.ts';
import * as add from './add.ts';
import * as create from './create.ts';
import * as diff from './diff.ts';
import * as eject from './eject.ts';

/** Options propres à certaines commandes : ailleurs, elles sont refusées. */
export const SCOPED = ['force', 'from', 'out', 'accent-hue', 'font-stack'] as const;

export interface CommandOptions {
  positionals: string[];
  dryRun: boolean;
  force: boolean | undefined;
  from: string | undefined;
  out: string | undefined;
  accentHue: string | undefined;
  fontStack: string | undefined;
}

export interface Context {
  io: CreateIo;
  template: SiteTemplate | undefined;
  theme?: ThemeBuilder | undefined;
}

interface Command {
  run: (options: CommandOptions, ctx: Context) => number;
  arg: string;
  allowed: readonly string[];
}

export const COMMANDS = {
  create: { run: create.run, arg: '<dossier>', allowed: ['accent-hue', 'font-stack'] },
  add: { run: add.run, arg: '<élément>', allowed: ['from'] },
  eject: { run: eject.run, arg: '<élément>', allowed: ['force', 'from', 'out'] },
  diff: { run: diff.run, arg: '<élément>', allowed: ['from'] },
} satisfies Record<string, Command>;

export type CommandName = keyof typeof COMMANDS;

const isCommandName = (name: string): name is CommandName => Object.hasOwn(COMMANDS, name);

export type Resolved = { name: CommandName; rest: string[] } | { error: string };

/** Commande et positionnels : un premier positionnel inconnu et seul vaut `create <dossier>`. */
export function resolveCommand(positionals: string[]): Resolved {
  const [first, ...rest] = positionals;
  if (first === undefined) return { error: 'commande manquante' };
  if (isCommandName(first)) return { name: first, rest };
  if (rest.length === 0) return { name: 'create', rest: positionals };
  return { error: `commande inconnue : ${first}` };
}

/** Message d'erreur d'usage propre à la commande, ou `null` si l'appel est valide. */
export function invalidCall(
  name: CommandName,
  rest: string[],
  values: Partial<Record<(typeof SCOPED)[number], unknown>>,
): string | null {
  const { arg, allowed }: Command = COMMANDS[name];
  if (rest.length !== 1) return `${name} : argument ${arg} ${rest.length ? 'en trop' : 'manquant'}`;
  const refused = SCOPED.find((key) => values[key] !== undefined && !allowed.includes(key));
  return refused ? `--${refused} ne s’applique pas à ${name}` : null;
}
