// Contrôle préalable d'un lot (D-015) : chaque commande d'acceptance distincte est lancée une fois
// sur la base, sauf celles qui visent un fichier qu'une tâche doit créer ou modifier (un test qui
// n'existe pas encore échouerait forcément). Une base rouge ferait échouer, puis escalader, toutes
// les tâches pour une raison qui n'est pas la leur : le lot ne part pas.

/** Commandes à vérifier sur la base, sans doublon, hors commandes qui citent un fichier de tâche. */
export function baselineCommands(tasks) {
  const owned = tasks.flatMap((task) => task.files);
  const commands = tasks.flatMap((task) => task.acceptance);
  return [...new Set(commands)].filter((cmd) => !owned.some((file) => cmd.includes(file)));
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
