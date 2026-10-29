// Faux monde pour les tests du dispatcher : git, Kiro et shell scénarisés par tentative, sans
// processus ni disque. `scenario.kiro[n]` décrit la tentative n (code, stderr, commit, créés…).
import models from '../models.json' with { type: 'json' };
import type { Git, Launch, ProcessResult, Shell } from './types.ts';
import type { Deps, DispatchConfig } from './deps.ts';

export const CONFIG: DispatchConfig = {
  baseBranch: 'main',
  worktreeRoot: '../wt',
  runsDir: '.agents/runs',
  routingLog: '.agents/routing-log.jsonl',
  timeoutMs: 1,
  acceptanceTimeoutMs: 1,
  trustTools: ['read'],
  reviewTrustTools: ['read'],
};

interface KiroStep {
  code?: number;
  stderr?: string;
  text?: string;
  commit?: boolean;
  created?: string[];
}

export interface Scenario {
  touched: string[][];
  acceptance: number[];
  kiro: KiroStep[];
  log: string;
}

export interface Calls {
  kiro: { command: string; model: string | undefined }[];
  removed: number;
  written: Record<string, string>;
  routing: unknown[];
}

const ok = (stdout = ''): ProcessResult => ({ code: 0, stdout, stderr: '', timedOut: false });

const fakeGit = (scenario: Scenario, calls: Calls, state: { attempt: number }): Git => {
  const current = (): KiroStep => scenario.kiro[state.attempt] ?? {};
  const handlers: Record<string, (args: string[]) => ProcessResult> = {
    log: () => ok(scenario.log),
    worktree: (args) => {
      if (args[1] === 'add') state.attempt += 1;
      if (args[1] === 'remove') calls.removed += 1;
      return ok();
    },
    'rev-parse': (args) => ok(args[1] === 'HEAD' && current().commit ? 'other' : 'base'),
    diff: () => ok((scenario.touched[state.attempt] ?? []).join('\n')),
    'ls-files': () => ok((current().created ?? []).join('\n')),
  };
  return async (args) => (handlers[args[0] ?? ''] ?? (() => ok()))(args);
};

export function world(overrides: Partial<Scenario> = {}): { deps: Deps; calls: Calls } {
  const scenario: Scenario = {
    touched: [['a.astro']],
    acceptance: [0],
    kiro: [{}],
    log: '',
    ...overrides,
  };
  const calls: Calls = { kiro: [], removed: 0, written: {}, routing: [] };
  const state = { attempt: -1 };
  const launch: Launch = async (command, args, options) => {
    calls.kiro.push({ command, model: args[args.indexOf('--model') + 1] });
    const step = scenario.kiro[state.attempt] ?? {};
    const data = { status: 'success', finalText: step.text ?? 'Fait.' };
    calls.written[options?.stdoutFile ?? ''] = JSON.stringify({ type: 'runFinished', data });
    return { code: step.code ?? 0, stdout: '', stderr: step.stderr ?? '', timedOut: false };
  };
  const shell: Shell = async (cmd) =>
    cmd.startsWith('npm ci') ? ok() : { ...ok(), code: scenario.acceptance[state.attempt] ?? 0 };
  const deps: Deps = {
    git: fakeGit(scenario, calls, state),
    launch,
    shell,
    fs: {
      mkdir: async () => {},
      appendFile: async (_, text) => calls.routing.push(JSON.parse(text)),
      writeFile: async (file, text) => (calls.written[file] = text),
    },
    now: () => 0,
    env: { PATH: '/bin' },
    models,
    config: CONFIG,
    emptyNpmrc: '/e',
    repoRoot: '/r',
    base: 'main',
  };
  return { deps, calls };
}
