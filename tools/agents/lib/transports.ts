// Transports interchangeables : `runAgent(input) → { code, timedOut, summary }`.
// - headless : kiro-cli chat --v3 --no-interactive (session `kiro-cli login`, aucun secret) ;
// - claude : repli (`claude -p`), si Kiro est indisponible ou à court de crédits.
// `--sandbox` n'existe pas en kiro-cli 2.32 : jamais `--trust-all-tools`, seulement une liste
// fermée (`--trust-tools`) et les règles `permissions` des agents (D-005).
import { readFileSync } from 'node:fs';
import { summarizeStream } from './stream.ts';
import type { Launch, ProcessResult, StreamSummary } from './types.ts';

export const KIRO_EXIT: Record<number, string> = {
  3: 'serveur MCP en échec',
  4: 'agent introuvable',
};

const readSummary = (file: string): StreamSummary => {
  try {
    return summarizeStream(readFileSync(file, 'utf8'));
  } catch {
    return summarizeStream('');
  }
};

export interface AgentInput {
  launch: Launch;
  engine: string;
  cwd: string;
  env: Record<string, string>;
  timeoutMs: number;
  stdoutFile: string;
  stderrFile: string;
  args: string[];
}

export interface AgentRun {
  code: number | null;
  timedOut: boolean;
  stderr: string;
  summary: StreamSummary;
}

export async function runAgent({
  launch,
  engine,
  cwd,
  env,
  timeoutMs,
  stdoutFile,
  stderrFile,
  args,
}: AgentInput): Promise<AgentRun> {
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
export function transportFailure({
  code,
  timedOut,
  summary,
}: Pick<ProcessResult, 'code' | 'timedOut'> & { summary: StreamSummary }): string | null {
  if (timedOut) return 'délai maximal dépassé';
  const known = code === null ? undefined : KIRO_EXIT[code];
  if (code !== 0) return `code de sortie ${code}${known ? ` (${known})` : ''}`;
  if (summary.status !== 'success' && summary.status !== 'unknown')
    return `statut ${summary.status}`;
  return null;
}
