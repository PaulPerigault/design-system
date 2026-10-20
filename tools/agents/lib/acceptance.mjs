// Commandes d'acceptation d'une tâche, lancées dans le worktree, l'une après l'autre (toutes, même
// après un échec, pour un diagnostic complet). Shell injecté : `shell(cmd, opts) → { code, … }`.

const TAIL_CHARS = 4_000;

/**
 * @param {{ shell: Function, cwd: string, env: Record<string, string>, commands: string[],
 *   timeoutMs: number, now?: () => number }} input
 * @returns {Promise<{ cmd: string, code: number | null, durationMs: number, tail: string }[]>}
 */
export async function runAcceptance({ shell, cwd, env, commands, timeoutMs, now = Date.now }) {
  const results = [];
  for (const cmd of commands) {
    const start = now();
    const { code, stdout, stderr, timedOut } = await shell(cmd, { cwd, env, timeoutMs });
    results.push({
      cmd,
      code: timedOut ? null : code,
      durationMs: now() - start,
      tail: `${stdout}\n${stderr}`.trim().slice(-TAIL_CHARS),
    });
  }
  return results;
}

export const acceptancePassed = (results) => results.every(({ code }) => code === 0);
