// Lancement de processus pour le dispatcher : promesse, délai maximal (SIGTERM puis SIGKILL),
// sorties gardées en mémoire (bornées) et, si demandé, copiées dans des fichiers.
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';

const KILL_GRACE_MS = 5_000;
const MAX_KEPT_CHARS = 2_000_000;

const keep = (buffer, chunk) => (buffer + chunk).slice(-MAX_KEPT_CHARS);

const pipeTo = (stream, file, onChunk) => {
  const sink = file ? createWriteStream(file) : null;
  stream.on('data', (chunk) => {
    sink?.write(chunk);
    onChunk(chunk.toString());
  });
  return () => sink?.end();
};

/**
 * @param {string} command exécutable
 * @param {string[]} args arguments
 * @param {{ cwd?: string, env?: Record<string, string>, input?: string, timeoutMs?: number,
 *   stdoutFile?: string, stderrFile?: string }} options
 * @returns {Promise<{ code: number | null, stdout: string, stderr: string, timedOut: boolean }>}
 */
export function run(command, args, options = {}) {
  const { cwd, env, input, timeoutMs, stdoutFile, stderrFile } = options;
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
    const out = { stdout: '', stderr: '', timedOut: false };
    const closeOut = pipeTo(
      child.stdout,
      stdoutFile,
      (text) => (out.stdout = keep(out.stdout, text)),
    );
    const closeErr = pipeTo(
      child.stderr,
      stderrFile,
      (text) => (out.stderr = keep(out.stderr, text)),
    );
    const timer = timeoutMs
      ? setTimeout(() => {
          out.timedOut = true;
          child.kill('SIGTERM');
          setTimeout(() => child.kill('SIGKILL'), KILL_GRACE_MS).unref();
        }, timeoutMs)
      : null;
    child.on('error', (error) => (out.stderr = keep(out.stderr, `${error.message}\n`)));
    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      closeOut();
      closeErr();
      resolve({ code, ...out });
    });
    child.stdin.end(input ?? '');
  });
}

/** Commande shell (acceptation) : `sh -c`, mêmes options. */
export const runShell = (commandLine, options) => run('sh', ['-c', commandLine], options);
