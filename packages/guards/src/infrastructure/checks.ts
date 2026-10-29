// Table des contrôles de pp-guards : nom -> { name, defaults, cliOptions, run(options, io) }.
import * as architecture from '../application/check-architecture.ts';
import * as design from '../application/check-design.ts';
import * as images from '../application/check-images.ts';
import * as layers from '../application/check-layers.ts';
import * as size from '../application/check-size.ts';
import { run as runTokens } from './check-tokens.ts';
import type { Check } from '../application/check.ts';
import type { GuardIo } from '../application/ports.ts';
import { isStrings } from '../domain/options.ts';
import type { Options } from '../domain/options.ts';
import { GuardUsageError } from '../errors.ts';

/** Ordre d'exécution de `pp-guards all`. */
export const ORDER = ['tokens', 'design', 'size', 'layers', 'architecture', 'images'];

/**
 * `check-tokens` garde son contrat `run(argv, io)` : on reconstruit l'argv depuis les options.
 */
function runTokensCheck({ tokens, roots }: Options, io: GuardIo): number {
  if (typeof tokens !== 'string' || tokens === '' || !isStrings(roots) || roots.length === 0) {
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
  design,
  size,
  layers,
  architecture,
  images,
};
