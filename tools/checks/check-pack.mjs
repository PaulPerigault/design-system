// Contrôle de publication à blanc : `npm pack --dry-run` sur chaque paquet, sortie JSON ignorée.
import { spawnSync } from 'node:child_process';
import { globSync, readFileSync } from 'node:fs';
import { parsePackOutput } from '../release/pack-output.mjs';
import { tarballProblems } from '../release/tarball-rules.mjs';

export const PACK_ARGS = ['pack', '--dry-run', '--workspaces', '--json'];

/** @returns {string | null} message d'échec d'un résultat `spawnSync`, `null` s'il a réussi */
export function packFailure(result) {
  if (result.error) return `npm introuvable : ${result.error.message}`;
  if (result.status !== 0) return `npm pack a échoué (code ${result.status}) :\n${result.stderr}`;
  return null;
}

/** @returns {Map<string, { wasm: boolean }>} paquets publiables (`packages/*`, non privés) */
export function publishable(read = (file) => JSON.parse(readFileSync(file, 'utf8'))) {
  const entries = globSync('packages/*/package.json')
    .map((file) => read(file))
    .filter((manifest) => !manifest.private);
  return new Map(entries.map((m) => [m.name, { wasm: (m.files ?? []).includes('wasm') }]));
}

/** @returns {string | null} échec si un tarball contient un fichier interdit ; avertissements à `warn` */
export function contentFailure(stdout, packages, warn = () => {}) {
  const blocking = [];
  for (const entry of parsePackOutput(stdout).filter((item) => packages.has(item.name))) {
    for (const { level, message } of tarballProblems(entry, packages.get(entry.name))) {
      if (level === 'blocking') blocking.push(`${entry.name} : ${message}`);
      else warn(`${entry.name} : ${message}`);
    }
  }
  if (blocking.length === 0) return null;
  return `contenu de tarball interdit :\n${blocking.join('\n')}`;
}

/**
 * Sous `npm run`, `npm_execpath` désigne le script de npm : lancé par Node, sans interpréteur.
 * Sinon, sous Windows, `npm` est un `.cmd` que `spawnSync` ne lance pas sans `shell`.
 */
function launch({ spawn, platform, env }) {
  const script = env.npm_execpath;
  const options = { encoding: 'utf8', stdio: 'pipe' };
  if (script) return spawn(process.execPath, [script, ...PACK_ARGS], options);
  return spawn('npm', PACK_ARGS, { ...options, shell: platform === 'win32' });
}

export function run({ packages = new Map(), warn = () => {}, ...system } = {}) {
  const { spawn = spawnSync, platform = process.platform, env = process.env } = system;
  const result = launch({ spawn, platform, env });
  return packFailure(result) ?? contentFailure(result.stdout, packages, warn);
}

if (import.meta.main) {
  const warn = (message) => console.warn(`avertissement : ${message}`);
  const failure = run({ packages: publishable(), warn });
  if (failure) {
    console.error(failure);
    process.exit(1);
  }
  console.log('check-pack: OK (npm pack --dry-run, tous les paquets)');
}
