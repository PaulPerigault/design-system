// Contrat commun des contrôles de pp-guards (table `CHECKS`, dispatch de `cli.ts`).
import type { GuardIo } from './io.ts';
import type { Options } from './options.ts';

export interface CliOption {
  type: 'string' | 'boolean';
  multiple?: boolean;
}

export type CliOptions = Record<string, CliOption>;

export interface Check {
  name: string;
  defaults: Options;
  cliOptions: CliOptions;
  run: (options: Options, io: GuardIo) => number;
}
