// Compilation reproductible : le chemin du dépôt et celui de `CARGO_HOME` sont embarqués dans le
// `.wasm` (messages de panic des dépendances). `--remap-path-prefix` les remplace par des préfixes
// fixes : le même source donne le même `.wasm` depuis n'importe quel dossier (poste, CI).
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Préfixes de remplacement : fixes, sans rapport avec la machine. */
export const REMAP_ROOT = '/workspace';
export const REMAP_CARGO = '/cargo';

export interface Env {
  [name: string]: string | undefined;
}

/** `CARGO_HOME` effectif : la variable, sinon `~/.cargo` (défaut de cargo). */
export const cargoHome = (env: Env, home: string = homedir()): string =>
  env.CARGO_HOME ?? join(home, '.cargo');

/** Les deux options `--remap-path-prefix`, du plus spécifique (cargo) au plus large (dépôt). */
export function remapFlags(root: string, cargo: string): string[] {
  const clean = (path: string): string => path.replace(/[\\/]+$/, '');
  return [
    `--remap-path-prefix=${clean(cargo)}=${REMAP_CARGO}`,
    `--remap-path-prefix=${clean(root)}=${REMAP_ROOT}`,
  ];
}

/** Environnement de `cargo build` : `RUSTFLAGS` existant conservé, remplacements ajoutés. */
export function reproducibleEnv(root: string, env: Env = process.env): Env {
  const flags = [env.RUSTFLAGS ?? '', ...remapFlags(root, cargoHome(env))];
  return { ...env, RUSTFLAGS: flags.filter((flag) => flag !== '').join(' ') };
}
