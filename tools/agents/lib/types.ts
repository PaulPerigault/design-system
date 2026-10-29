// Types partagés du dispatcher : processus, tâche, tentative, résultat. Les dépendances (git,
// shell, fs, horloge) sont injectées sous ces formes ; les tests fournissent des faux.

export interface ProcessResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export interface RunOptions {
  cwd?: string | undefined;
  env?: Record<string, string> | undefined;
  input?: string | undefined;
  timeoutMs?: number | undefined;
  stdoutFile?: string | undefined;
  stderrFile?: string | undefined;
}

export type Launch = (
  command: string,
  args: string[],
  options?: RunOptions,
) => Promise<ProcessResult>;
export type Shell = (commandLine: string, options?: RunOptions) => Promise<ProcessResult>;
export type Git = (
  args: string[],
  options?: { cwd?: string | undefined },
) => Promise<ProcessResult>;
/** Verrou d'une commande lourde : rend la fonction qui le libère, ou `null` si inutile. */
export type HeavyLock = (command: string) => Promise<(() => void) | null> | null;

export interface Task {
  id: string;
  title: string;
  engine: string;
  agent: string;
  tier: string;
  effort: string;
  files: string[];
  acceptance: string[];
  depends_on: string[];
  body: string;
}

export interface StreamSummary {
  status: string;
  finalText: string;
  credits: number;
  toolCalls: string[];
  sessionId: string | null;
  events: number;
}

export interface AcceptanceResult {
  cmd: string;
  code: number | null;
  durationMs: number;
  tail: string;
}

export interface Ownership {
  filesTouched: string[];
  outOfScope: string[];
  committed: boolean;
}

export interface HistoryEntry {
  tier: string;
  model: string;
  engine: string;
  outcome: string;
}

export interface Attempt {
  engine: string;
  tier: string;
  model?: string;
  worktree?: string | null;
  summary?: StreamSummary | undefined;
  acceptance?: AcceptanceResult[];
  ownership?: Ownership | null;
  failure?: string | null;
  quota?: boolean;
  durationMs?: number;
  history?: HistoryEntry[];
}

export interface TaskResult {
  id: string;
  title: string;
  status: string;
  failure: string | null;
  engine: string;
  tier: string;
  model: string | undefined;
  filesTouched: string[];
  outOfScope: string[];
  acceptance: { cmd: string; code: number | null; durationMs: number }[];
  credits: number | null;
  toolCalls: number;
  durationMs: number;
  worktree: string | null;
  attempts: HistoryEntry[];
}

export interface Models {
  tiers: Record<string, { model: string }>;
  escalation: string[];
  claude: { default: string; hard: string };
}
