// Contrôle de publication à blanc : `npm pack --dry-run` sur chaque paquet, sortie JSON ignorée.
import { spawnSync } from 'node:child_process';

export const PACK_ARGS = ['pack', '--dry-run', '--workspaces', '--json'];

/** @returns {string | null} message d'échec d'un résultat `spawnSync`, `null` s'il a réussi */
export function packFailure(result) {
  if (result.error) return `npm introuvable : ${result.error.message}`;
  if (result.status !== 0) return `npm pack a échoué (code ${result.status}) :\n${result.stderr}`;
  return null;
}

/**
 * Sous `npm run`, `npm_execpath` désigne le script de npm : lancé par Node, sans interpréteur.
 * Sinon, sous Windows, `npm` est un `.cmd` que `spawnSync` ne lance pas sans `shell`.
 */
export function run({ spawn = spawnSync, platform = process.platform, env = process.env } = {}) {
  const script = env.npm_execpath;
  const options = { encoding: 'utf8', stdio: 'pipe' };
  return packFailure(
    script
      ? spawn(process.execPath, [script, ...PACK_ARGS], options)
      : spawn('npm', PACK_ARGS, { ...options, shell: platform === 'win32' }),
  );
}

if (import.meta.main) {
  const failure = run();
  if (failure) {
    console.error(failure);
    process.exit(1);
  }
  console.log('check-pack: OK (npm pack --dry-run, tous les paquets)');
}
