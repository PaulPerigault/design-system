// Contrôle : la scène 3D n'écrit aucune couleur, durée ni courbe en dur, et lit seulement des
// jetons qui existent (ADR-0012). Complète `design`, qui ne lit ni le Rust ni le GLSL.
import type { GuardIo } from './ports.ts';
import type { CliOptions } from './check.ts';
import { listFiles } from './files.ts';
import { isTestPath, SCENE_MESSAGES, sceneHits } from '../domain/scene/literals.ts';
import { knownTokenNames, unknownThemeTokens } from '../domain/scene/theme-tokens.ts';
import { listOption, nonEmptyListOption } from '../domain/options.ts';
import type { Options } from '../domain/options.ts';
import { GuardUsageError } from '../errors.ts';
import type { Problem } from '../domain/problem.ts';
import { report } from './report.ts';

export const name = 'scene';

const NO_FILES: string[] = [];

export const defaults = {
  roots: ['src'],
  extensions: ['.rs', '.ts', '.glsl'],
  themeFiles: NO_FILES,
  tokens: 'tokens.json',
};

export const cliOptions: CliOptions = { tokens: { type: 'string' as const } };

function literalProblems(io: GuardIo, files: string[]): Problem[] {
  return files
    .filter((file) => !isTestPath(file))
    .flatMap((file) =>
      sceneHits(io.readText(file)).map(({ rule, line, excerpt }) => ({
        file,
        line,
        message: `${SCENE_MESSAGES[rule]} (${excerpt})`,
      })),
    );
}

function tokenProblems(io: GuardIo, themeFiles: string[], tokensPath: string): Problem[] {
  if (themeFiles.length === 0) return [];
  if (!io.exists(tokensPath))
    throw new GuardUsageError(`scene : tokens introuvable (${tokensPath})`);
  const known = knownTokenNames(JSON.parse(io.readText(tokensPath)));
  return themeFiles.flatMap((file) =>
    unknownThemeTokens(io.readText(file), known).map(({ name: token, line }) => ({
      file,
      line,
      message: `jeton inconnu « ${token} » : absent de ${tokensPath}`,
    })),
  );
}

export function run(options: Options, io: GuardIo): 0 | 1 {
  const roots = nonEmptyListOption(options, 'roots', defaults.roots);
  const extensions = nonEmptyListOption(options, 'extensions', defaults.extensions);
  const themeFiles = listOption(options, 'themeFiles', defaults.themeFiles);
  const tokens = typeof options.tokens === 'string' ? options.tokens : defaults.tokens;
  const files = listFiles(io, roots, { extensions });
  const problems = [...literalProblems(io, files), ...tokenProblems(io, themeFiles, tokens)];
  return report(io, { name, problems, checked: files.length });
}
