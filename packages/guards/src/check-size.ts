// Contrôle : aucun fichier source ne dépasse `max` lignes (on découpe, on ne relève pas).
import { listFiles } from './lib/files.ts';
import { GuardUsageError, report } from './lib/report.ts';

export const name = 'size';

const MAX_LINES = 120;

export const defaults = {
  max: MAX_LINES,
  extensions: ['.ts', '.astro', '.css', '.mjs'],
  roots: ['src'],
};

export const cliOptions: Record<string, { type: 'string' | 'boolean'; multiple?: boolean }> = {
  max: { type: 'string' as const },
  ext: { type: 'string' as const, multiple: true },
};

/**
 * Même comptage que `tools/checks/check-size.mjs` : un saut de ligne final ne compte pas.
 */
export const countLines = (text: string): number =>
  text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;

function parseMax(value: unknown): number {
  const max = typeof value === 'string' ? Number(value.trim() === '' ? Number.NaN : value) : (value as number);
  if (!Number.isInteger(max) || max <= 0) {
    throw new GuardUsageError(`--max doit être un entier positif (reçu : ${String(value)})`);
  }
  return max;
}

const nonEmpty = (list: string[] | undefined, fallback: string[]): string[] =>
  list && list.length > 0 ? list : fallback;

interface SizeOptions {
  max?: number | string;
  extensions?: string[];
  ext?: string[];
  roots?: string[];
}

export function run(options: SizeOptions, io: import('./lib/io.ts').GuardIo): 0 | 1 {
  const max = parseMax(options.max ?? defaults.max) as number;
  const extensions = nonEmpty(options.ext, nonEmpty(options.extensions, defaults.extensions));
  const roots = nonEmpty(options.roots, defaults.roots);
  const files = listFiles(io, roots, { extensions }) as string[];
  const problems = files
    .map((file) => ({ file, lines: countLines(io.readText(file)) }))
    .filter(({ lines }) => lines > max)
    .map(({ file, lines }) => ({ file, message: `${lines} lignes (max ${max})` }));
  return report(io, { name, problems, checked: files.length });
}
