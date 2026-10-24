// Table des contrôles de pp-guards : nom -> { name, defaults, cliOptions, run(options, io) }.
import * as design from './check-design.ts';
import * as images from './check-images.ts';
import * as layers from './check-layers.ts';
import * as size from './check-size.ts';
import { run as runTokens } from './check-tokens.ts';
import type { GuardIo } from './lib/io.ts';
import { GuardUsageError } from './lib/report.ts';

/** Ordre d'exécution de `pp-guards all`. */
export const ORDER = ['tokens', 'design', 'size', 'layers', 'images'];

interface Check {
  name: string;
  defaults: Record<string, unknown>;
  cliOptions: Record<string, { type: 'string' | 'boolean'; multiple?: boolean }>;
  run: (options: Record<string, unknown>, io: GuardIo) => number;
}

/**
 * `check-tokens` garde son contrat `run(argv, io)` : on reconstruit l'argv depuis les options.
 */
function runTokensCheck({ tokens, roots = [] }: { tokens?: string; roots?: string[] }, io: GuardIo): number {
  if (typeof tokens !== 'string' || tokens === '' || roots.length === 0) {
    throw new GuardUsageError('tokens : --tokens <tokens.json> et au moins une racine requis');
  }
  const adapted = {
    readFile: (path: string): string => io.readText(path),
    readdirSync: (dir: string) => io.readdir(dir),
    out: io.out,
    err: io.err,
  };
  return runTokens(['--tokens', tokens, ...roots], adapted);
}

const tokensCheck: Check = {
  name: 'tokens',
  defaults: {},
  cliOptions: { tokens: { type: 'string' as const } },
  run: runTokensCheck,
};

export const CHECKS: Record<string, Check> = { 
  tokens: tokensCheck, 
  design: design as unknown as Check, 
  size: size as unknown as Check, 
  layers: layers as unknown as Check, 
  images: images as unknown as Check 
};
