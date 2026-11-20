// Passe `wasm-opt -Oz` sur un `.wasm` produit par wasm-bindgen (ADR-0012, décision 3).
//
// `binaryen` (npm, version exacte en devDependency racine) fournit `bin/wasm-opt`, un script Node :
// même commande sous Windows et sous Linux, aucun outil global, aucun binaire natif. Le script
// échoue clairement si l'outil manque, au lieu de sauter l'étape : le poids affiché doit dire si
// la passe a eu lieu.
import { spawnSync } from 'node:child_process';
import { renameSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

/** Niveau d'optimisation : la taille d'abord, au prix du temps de compilation. */
export const OPT_LEVEL = '-Oz';

/**
 * Fonctionnalités WebAssembly de la cible `wasm32-unknown-unknown` de la chaîne épinglée
 * (`rust-toolchain.toml`). `strip = true` retire la section `target_features` : sans cette liste,
 * `wasm-opt` rejette tout module qui en emploie une (« error validating input »).
 */
export const FEATURES = [
  'bulk-memory',
  'multivalue',
  'mutable-globals',
  'nontrapping-float-to-int',
  'reference-types',
  'sign-ext',
] as const;

export class WasmOptError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'WasmOptError';
  }
}

export type Resolve = (specifier: string) => string;
export type Run = (
  command: string,
  args: string[],
) => { status: number | null; error?: Error | undefined };

const defaultResolve: Resolve = (specifier) => createRequire(import.meta.url).resolve(specifier);
const defaultRun: Run = (command, args) => spawnSync(command, args, { stdio: 'inherit' });

/** Chemin du script `wasm-opt` de binaryen ; `WasmOptError` si le paquet n'est pas installé. */
export function wasmOptPath(resolve: Resolve = defaultResolve): string {
  try {
    return join(dirname(resolve('binaryen/package.json')), 'bin', 'wasm-opt');
  } catch (cause) {
    throw new WasmOptError('binaryen est absent : lancer « npm ci » à la racine du dépôt.', {
      cause,
    });
  }
}

export function wasmOptArgs(input: string, output: string): string[] {
  return [OPT_LEVEL, ...FEATURES.map((feature) => `--enable-${feature}`), input, '-o', output];
}

/** Optimise `file` sur place (écriture dans un fichier voisin, puis remplacement). */
export function optimize(
  file: string,
  deps: { resolve?: Resolve; run?: Run; replace?: (from: string, to: string) => void } = {},
): void {
  const { resolve = defaultResolve, run = defaultRun, replace = renameSync } = deps;
  const script = wasmOptPath(resolve);
  const output = `${file}.opt`;
  console.log(`$ wasm-opt ${OPT_LEVEL} ${file}`);
  const { status, error } = run(process.execPath, [script, ...wasmOptArgs(file, output)]);
  if (status !== 0) {
    throw new WasmOptError(`wasm-opt a échoué (code ${status ?? 'aucun'})`, { cause: error });
  }
  replace(output, file);
}
