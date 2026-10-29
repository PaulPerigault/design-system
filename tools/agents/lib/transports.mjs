// Transports interchangeables : `runAgent(input) → { code, timedOut, summary }`.
// - headless : kiro-cli chat --v3 --no-interactive (session `kiro-cli login`, aucun secret) ;
// - claude : repli (`claude -p`), si Kiro est indisponible ou à court de crédits.
// `--sandbox` n'existe pas en kiro-cli 2.32 : jamais `--trust-all-tools`, seulement une liste
// fermée (`--trust-tools`) et les règles `permissions` des agents (D-005).
import { readFileSync } from 'node:fs';
import { summarizeStream } from './stream.ts';

export const KIRO_EXIT = { 3: 'serveur MCP en échec', 4: 'agent introuvable' };

/** Arguments de kiro-cli pour une exécution headless. */
export function kiroArgs({ agent, model, effort, trustTools, prompt }) {
  return [
    'chat',
    '--v3',
    '--no-interactive',
    '--agent',
    agent,
    '--model',
    model,
    '--effort',
    effort,
    '--output-format',
    'stream-json',
    '--require-mcp-startup',
    `--trust-tools=${trustTools.join(',')}`,
    prompt,
  ];
}

/** Arguments de `claude -p` (repli) : outils limités, aucune signature, règles du dépôt. */
export function claudeArgs({ model, prompt, readOnly }) {
  const tools = readOnly
    ? 'Read,Grep,Glob,Bash(npm test*),Bash(npm run *),Bash(npx vitest*),Bash(git diff*),Bash(git status*)'
    : 'Read,Grep,Glob,Edit,Write,Bash(npm test*),Bash(npm run *),Bash(npx vitest*),Bash(npx prettier*),Bash(npx eslint*),Bash(git diff*),Bash(git status*)';
  return [
    '-p',
    prompt,
    '--model',
    model,
    '--output-format',
    'stream-json',
    '--verbose',
    '--allowedTools',
    tools,
  ];
}

const readSummary = (file) => {
  try {
    return summarizeStream(readFileSync(file, 'utf8'));
  } catch {
    return summarizeStream('');
  }
};

/**
 * @param {{ launch: Function, engine: 'kiro' | 'claude', cwd: string, env: Record<string, string>,
 *   timeoutMs: number, stdoutFile: string, stderrFile: string, args: string[] }} input
 */
export async function runAgent({
  launch,
  engine,
  cwd,
  env,
  timeoutMs,
  stdoutFile,
  stderrFile,
  args,
}) {
  const command = engine === 'kiro' ? 'kiro-cli' : 'claude';
  const result = await launch(command, args, { cwd, env, timeoutMs, stdoutFile, stderrFile });
  return {
    code: result.code,
    timedOut: result.timedOut,
    stderr: result.stderr,
    summary: readSummary(stdoutFile),
  };
}

/** Raison d'échec du transport, ou null si l'agent a fini normalement. */
export function transportFailure({ code, timedOut, summary }) {
  if (timedOut) return 'délai maximal dépassé';
  if (code !== 0) return `code de sortie ${code}${KIRO_EXIT[code] ? ` (${KIRO_EXIT[code]})` : ''}`;
  if (summary.status !== 'success' && summary.status !== 'unknown')
    return `statut ${summary.status}`;
  return null;
}
