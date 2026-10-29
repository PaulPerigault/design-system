// Installation des worktrees par amorce : les `node_modules` d'un premier `npm ci` sont copiés une
// fois dans `.agents/seeds/<empreinte du lockfile>/`, puis clonés dans chaque worktree par
// `cp -cR` (clone APFS, instantané, sans doubler l'espace disque). Les liens des workspaces sont
// relatifs : clonés, ils pointent vers les paquets du worktree. Lockfile modifié = nouvelle amorce.
import { createHash } from 'node:crypto';
import type { Shell } from './types.ts';

const NPM_CI = 'npm ci --prefer-offline --no-audit --no-fund --ignore-scripts';
const MODULE_DIRS = ['node_modules', 'packages/*/node_modules', 'apps/*/node_modules'];

export const lockHash = (text: string): string =>
  createHash('sha256').update(text).digest('hex').slice(0, 16);

const quote = (path: string): string => `'${path.replace(/'/g, "'\\''")}'`;

/**
 * Copie (clone APFS) des dossiers `node_modules` de `from` vers `to`, chemins relatifs conservés.
 * La cible est d'abord supprimée : `cp -R` vers un dossier existant copierait la source dedans
 * (`node_modules/node_modules`, constaté sur un worktree installé deux fois).
 */
const cloneModules = (from: string, to: string): string =>
  `cd ${quote(from)} && for d in ${MODULE_DIRS.join(' ')}; do [ -d "$d" ] && mkdir -p ${quote(to)}/"$(dirname "$d")" && rm -rf ${quote(to)}/"$d" && cp -cR "$d" ${quote(to)}/"$d"; done; true`;

/**
 * Installe les dépendances du worktree : clone de l'amorce si elle existe pour ce lockfile,
 * sinon `npm ci` puis création de l'amorce.
 */
export interface SeedFs {
  readFileSync: (file: string, encoding: 'utf8') => string;
  existsSync: (file: string) => boolean;
}

export interface InstallInput {
  shell: Shell;
  fs: SeedFs;
  seedsDir: string;
  cwd: string;
  env: Record<string, string>;
  timeoutMs: number;
}

export async function installDependencies({
  shell,
  fs,
  seedsDir,
  cwd,
  env,
  timeoutMs,
}: InstallInput): Promise<{ code: number | null; stderr: string; seeded: boolean }> {
  const seed = `${seedsDir}/${lockHash(fs.readFileSync(`${cwd}/package-lock.json`, 'utf8'))}`;
  const opts = { cwd, env, timeoutMs };
  if (fs.existsSync(`${seed}/ready`)) {
    const cloned = await shell(cloneModules(seed, cwd), opts);
    return { code: cloned.code, stderr: cloned.stderr, seeded: true };
  }
  const installed = await shell(NPM_CI, opts);
  if (installed.code !== 0)
    return { code: installed.code, stderr: installed.stderr, seeded: false };
  const tmp = `${seed}.${process.pid}.tmp`;
  const saved = await shell(
    `${cloneModules(cwd, tmp)} && mv ${quote(tmp)} ${quote(seed)} && touch ${quote(seed)}/ready`,
    opts,
  );
  return { code: 0, stderr: saved.code === 0 ? '' : saved.stderr, seeded: false };
}
