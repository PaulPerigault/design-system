// Installation des worktrees par amorce : les `node_modules` d'un premier `npm ci` sont copiés une
// fois dans `.agents/seeds/<empreinte du lockfile>/`, puis clonés dans chaque worktree par
// `cp -cR` (clone APFS, instantané, sans doubler l'espace disque). Les liens des workspaces sont
// relatifs : clonés, ils pointent vers les paquets du worktree. Lockfile modifié = nouvelle amorce.
import { createHash } from 'node:crypto';

const NPM_CI = 'npm ci --prefer-offline --no-audit --no-fund --ignore-scripts';
const MODULE_DIRS = ['node_modules', 'packages/*/node_modules', 'apps/*/node_modules'];

export const lockHash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16);

const quote = (path) => `'${path.replace(/'/g, "'\\''")}'`;

/** Copie (clone APFS) des dossiers `node_modules` de `from` vers `to`, chemins relatifs conservés. */
const cloneModules = (from, to) =>
  `cd ${quote(from)} && for d in ${MODULE_DIRS.join(' ')}; do [ -d "$d" ] && mkdir -p ${quote(to)}/"$(dirname "$d")" && cp -cR "$d" ${quote(to)}/"$d"; done; true`;

/**
 * Installe les dépendances du worktree : clone de l'amorce si elle existe pour ce lockfile,
 * sinon `npm ci` puis création de l'amorce.
 * @param {{ shell: Function, fs: object, seedsDir: string, cwd: string, env: object, timeoutMs: number }} input
 * @returns {Promise<{ code: number, stderr: string, seeded: boolean }>}
 */
export async function installDependencies({ shell, fs, seedsDir, cwd, env, timeoutMs }) {
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
