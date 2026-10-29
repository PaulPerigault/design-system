// Contrôle : aucun fichier source ne dépasse `max` lignes (on découpe, on ne relève pas).
import type { GuardIo } from './ports.ts';
import type { CliOptions } from './check.ts';
import { listFiles } from './files.ts';
import { nonEmptyListOption } from '../domain/options.ts';
import type { Options } from '../domain/options.ts';
import { GuardUsageError } from '../errors.ts';
import { report } from './report.ts';

export const name = 'size';

const MAX_LINES = 120;

export const defaults = {
  max: MAX_LINES,
  extensions: ['.ts', '.astro', '.css', '.mjs'],
  roots: ['src'],
};

export const cliOptions: CliOptions = {
  max: { type: 'string' as const },
  ext: { type: 'string' as const, multiple: true },
};

/**
 * Même comptage que `tools/checks/check-size.mjs` : un saut de ligne final ne compte pas.
 */
export const countLines = (text: string): number =>
  text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return Number.NaN;
}

function parseMax(value: unknown): number {
  const max = toNumber(value);
  if (!Number.isInteger(max) || max <= 0) {
    throw new GuardUsageError(`--max doit être un entier positif (reçu : ${String(value)})`);
  }
  return max;
}

export function run(options: Options, io: GuardIo): 0 | 1 {
  const max = parseMax(options.max ?? defaults.max);
  const fallback = nonEmptyListOption(options, 'extensions', defaults.extensions);
  const extensions = nonEmptyListOption(options, 'ext', fallback);
  const roots = nonEmptyListOption(options, 'roots', defaults.roots);
  const files = listFiles(io, roots, { extensions });
  const problems = files
    .map((file) => ({ file, lines: countLines(io.readText(file)) }))
    .filter(({ lines }) => lines > max)
    .map(({ file, lines }) => ({ file, message: `${lines} lignes (max ${max})` }));
  return report(io, { name, problems, checked: files.length });
}
