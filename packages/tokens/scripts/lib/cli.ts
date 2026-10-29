/** Arguments de `build.ts` : `--check`, `--accent-hue`, `--font-stack`, `--out-dir`. */
import { parseArgs } from 'node:util';
import { parseBuildInput } from '../../src/customize/input.ts';
import type { BuildInput } from '../../src/customize/input.ts';
import type { Result } from '../../src/customize/result.ts';
import { fail, ok } from '../../src/customize/result.ts';

export interface Cli {
  check: boolean;
  input: BuildInput;
  outDir: string | undefined;
}

const OPTIONS = {
  check: { type: 'boolean' },
  'accent-hue': { type: 'string' },
  'font-stack': { type: 'string' },
  'out-dir': { type: 'string' },
} as const;

/**
 * Une entrée personnalisée ne s'écrit jamais dans `generated/` (versionné) : `--out-dir` est
 * exigé, et `--check` ne vaut que pour la génération par défaut.
 */
export function parseCli(argv: string[]): Result<Cli> {
  const { values } = parseArgs({ args: argv, options: OPTIONS, strict: false });
  const raw = {
    ...(values['accent-hue'] === undefined ? {} : { accentHue: values['accent-hue'] }),
    ...(values['font-stack'] === undefined ? {} : { fontStack: values['font-stack'] }),
  };
  const input = parseBuildInput(raw);
  if (!input.ok) return input;
  const custom = Object.keys(raw).length > 0;
  const outDir = typeof values['out-dir'] === 'string' ? values['out-dir'] : undefined;
  const check = values.check === true;
  if (custom && (outDir === undefined || check)) {
    return fail('build.bad-usage', 'Entrées personnalisées : --out-dir requis, sans --check.');
  }
  return ok({ check, input: input.value, outDir });
}
