/** Exécution du build : génération, comparaison (`--check`) ou écriture, entrées-sorties injectées. */
import type { BuildInput } from '../../src/customize/input.ts';
import type { CustomizeError } from '../../src/customize/result.ts';
import { generateWith } from './generate.ts';

/** Fichiers absents ou différents de la génération. */
export function findDrift(
  outputs: Record<string, string>,
  readTarget: (name: string) => string | undefined,
): string[] {
  return Object.keys(outputs).filter((name) => readTarget(name) !== outputs[name]);
}

/**
 * Entrées-sorties injectées : `readText` (source), `readTarget` (généré, `undefined` si absent),
 * `writeTarget` (écriture, hors `--check`), `input` (teinte et pile ; défaut : sources telles quelles).
 */
export interface RunIo {
  check: boolean;
  readText: (name: string) => string;
  readTarget: (name: string) => string | undefined;
  writeTarget: (name: string, text: string) => void;
  input?: BuildInput;
}

export interface RunResult {
  code: 0 | 1;
  files: string[];
  error?: CustomizeError;
}

export function run({ check, readText, readTarget, writeTarget, input = {} }: RunIo): RunResult {
  const generated = generateWith(readText, input);
  if (!generated.ok) return { code: 1, files: [], error: generated.error };
  const outputs = generated.value;
  if (check) {
    const files = findDrift(outputs, readTarget);
    return { code: files.length > 0 ? 1 : 0, files };
  }
  for (const [name, text] of Object.entries(outputs)) writeTarget(name, text);
  return { code: 0, files: Object.keys(outputs) };
}
