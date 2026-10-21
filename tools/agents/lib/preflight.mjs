// Contrôle préalable d'un lot (D-015) : chaque commande d'acceptance distincte est lancée une fois
// sur la base, sauf celles qui visent un fichier qu'une tâche doit créer ou modifier (un test qui
// n'existe pas encore échouerait forcément). Une base rouge ferait échouer, puis escalader, toutes
// les tâches pour une raison qui n'est pas la leur : le lot ne part pas.

const parents = (file) =>
  file
    .split('/')
    .slice(0, -1)
    .map((_, i, parts) => parts.slice(0, i + 1).join('/'));

/**
 * Commandes à vérifier sur la base, sans doublon, hors commandes qui citent un fichier de tâche
 * ou un dossier que les tâches vont créer (absent de la base : `exists` injecté).
 */
export function baselineCommands(tasks, exists = () => true) {
  const owned = tasks.flatMap((task) => task.files);
  const missingDirs = [...new Set(owned.flatMap(parents))].filter((dir) => !exists(dir));
  const skip = [...owned, ...missingDirs];
  const commands = tasks.flatMap((task) => task.acceptance);
  return [...new Set(commands)].filter((cmd) => !skip.some((path) => cmd.includes(path)));
}

/**
 * @param {{ shell: Function, cwd: string, env: object, timeoutMs: number, lock?: Function }} deps
 * @param {string[]} commands
 * @returns {Promise<{ cmd: string, code: number | null, tail: string }[]>} commandes en échec
 */
export async function failingBaseline({ shell, cwd, env, timeoutMs, lock }, commands) {
  const failures = [];
  for (const cmd of commands) {
    const release = lock ? await lock(cmd) : null;
    const result = await shell(cmd, { cwd, env, timeoutMs }).finally(() => release?.());
    if (result.code !== 0)
      failures.push({
        cmd,
        code: result.code,
        tail: `${result.stdout}\n${result.stderr}`.trim().slice(-1500),
      });
  }
  return failures;
}
