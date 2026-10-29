// Dépendances injectées du dispatcher : configuration, système de fichiers, git, shell.
import type {
  AcceptanceResult,
  Git,
  HeavyLock,
  Launch,
  Models,
  Ownership,
  Shell,
} from './types.ts';

export interface DispatchConfig {
  transport?: string;
  baseBranch: string;
  worktreeRoot: string;
  runsDir: string;
  routingLog: string;
  timeoutMs: number;
  acceptanceTimeoutMs: number;
  trustTools: string[];
  reviewTrustTools: string[];
  kiro?: { available?: boolean; reason?: string };
}

export interface DispatchFs {
  appendFile: (file: string, text: string) => Promise<unknown>;
  mkdir: (dir: string, options: { recursive: boolean }) => Promise<unknown>;
  writeFile: (file: string, text: string) => Promise<unknown>;
}

export interface InstallOptions {
  cwd: string;
  env: Record<string, string>;
  timeoutMs: number;
}

/** Dépendances injectées du dispatcher (vraies dans `cli.ts`, fausses dans les tests). */
export interface Deps {
  git: Git;
  launch: Launch;
  shell: Shell;
  fs: DispatchFs;
  now: () => number;
  env: Record<string, string>;
  models: Models;
  config: DispatchConfig;
  emptyNpmrc: string;
  repoRoot: string;
  stateRoot?: string;
  base: string;
  install?: (options: InstallOptions) => Promise<{ code: number | null; stderr: string }>;
  slot?: () => Promise<() => void>;
  onQuota?: () => void;
  heavyLock?: HeavyLock;
}

export interface WorktreeInfo {
  path: string;
  branch: string;
  baseSha: string;
}

export interface VerifyResult {
  acceptance: AcceptanceResult[];
  ownership: Ownership;
  failure: string | null;
}

/** Dépendances du moteur ds-lead : état partagé, installation par amorce et sémaphore requis. */
export type LeadDeps = Deps & {
  stateRoot: string;
  install: NonNullable<Deps['install']>;
  slot: NonNullable<Deps['slot']>;
};
