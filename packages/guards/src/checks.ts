// Table des contrôles de pp-guards : nom -> { name, defaults, cliOptions, run(options, io) }.
import * as design from './check-design.ts';
import * as images from './check-images.ts';
import * as layers from './check-layers.ts';
import * as size from './check-size.ts';
import { run as runTokens } from './check-tokens.ts';
import { GuardUsageError } from './lib/report.ts';

/** Ordre d'exécution de `pp-guards all`. */
export const ORDER = ['tokens', 'design', 'size', 'layers', 'images'];

/**
 * `check-tokens` garde son contrat `run(argv, io)` : on reconstruit l'argv depuis les options.
 * @param {{ tokens?: string, roots?: string[] }} options
 * @param {import('./lib/io.ts').GuardIo} io
 * @returns {number}
 */
function runTokensCheck({ tokens, roots = [] }, io) {
  if (typeof tokens !== 'string' || tokens === '' || roots.length === 0) {
    throw new GuardUsageError('tokens : --tokens <tokens.json> et au moins une racine requis');
  }
  const adapted = {
    readFile: (path) => io.readText(path),
    readdirSync: (dir) => io.readdir(dir),
    out: io.out,
    err: io.err,
  };
  return runTokens(['--tokens', tokens, ...roots], adapted);
}

const tokensCheck = {
  name: 'tokens',
  defaults: {},
  cliOptions: { tokens: { type: 'string' } },
  run: runTokensCheck,
};

/** @type {Record<string, { name: string, defaults: object, cliOptions: object, run: Function }>} */
export const CHECKS = { tokens: tokensCheck, design, size, layers, images };
