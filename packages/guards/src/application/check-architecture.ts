// Contrôle : dans un paquet, un anneau n'importe jamais un anneau plus externe
// (domain ← application ← infrastructure), et seul l'anneau externe touche `node:*` et les paquets.
import { ringOf, ringViolation } from '../domain/architecture/rings.ts';
import type { RingConfig } from '../domain/architecture/rings.ts';
import { importsDetailed } from '../domain/layers/imports.ts';
import { listOption, nonEmptyListOption } from '../domain/options.ts';
import type { Options } from '../domain/options.ts';
import type { Problem } from '../domain/problem.ts';
import { GuardUsageError } from '../errors.ts';
import { listFiles } from './files.ts';
import type { GuardIo } from './ports.ts';
import { report } from './report.ts';

export const name = 'architecture';

export const defaults = {
  roots: [],
  rings: ['domain', 'application', 'infrastructure'],
  pureNode: ['node:path', 'node:buffer', 'node:util'],
  allowPackages: [],
  extensions: ['.ts'],
};

export const cliOptions = {};

const NO_RING = {
  file: 'architecture',
  message: "aucun fichier n'appartient à un anneau : vérifier roots et rings",
};

function parseConfig(options: Options): RingConfig {
  const roots = listOption(options, 'roots', defaults.roots);
  if (roots.length === 0) throw new GuardUsageError('architecture : roots est requis, non vide');
  return {
    roots,
    rings: nonEmptyListOption(options, 'rings', defaults.rings),
    pureNode: listOption(options, 'pureNode', defaults.pureNode),
    allowPackages: listOption(options, 'allowPackages', defaults.allowPackages),
  };
}

function problemsOf(config: RingConfig, io: GuardIo, file: string): Problem[] {
  return importsDetailed(io.readText(file), file).flatMap((ref) => {
    const message = ringViolation(config, file, ref);
    return message === null ? [] : [{ file, line: ref.line, message }];
  });
}

export function run(options: Options, io: GuardIo): 0 | 1 {
  const config = parseConfig(options);
  const extensions = nonEmptyListOption(options, 'extensions', defaults.extensions);
  const files = listFiles(io, config.roots, { extensions });
  const owned = files.filter((file) => ringOf(config, file) >= 0);
  const problems =
    owned.length === 0 ? [NO_RING] : owned.flatMap((file) => problemsOf(config, io, file));
  return report(io, { name, problems, checked: owned.length });
}
