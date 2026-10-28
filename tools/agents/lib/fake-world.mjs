// Faux monde pour les tests du dispatcher : git, Kiro et shell scénarisés par tentative, sans
// processus ni disque. `scenario.kiro[n]` décrit la tentative n (code, stderr, commit, créés…).
import models from '../models.json' with { type: 'json' };

export const CONFIG = {
  worktreeRoot: '../wt',
  runsDir: '.agents/runs',
  routingLog: '.agents/routing-log.jsonl',
  timeoutMs: 1,
  acceptanceTimeoutMs: 1,
  trustTools: ['read'],
  reviewTrustTools: ['read'],
};

const ok = (stdout = '') => ({ code: 0, stdout, stderr: '', timedOut: false });

const fakeGit = (scenario, calls, state) => {
  const current = () => scenario.kiro[state.attempt] ?? {};
  const handlers = {
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
  return async (args) => (handlers[args[0]] ?? ok)(args);
};

/** @returns {{ deps: object, calls: object }} */
export function world(overrides = {}) {
  const scenario = { touched: [['a.astro']], acceptance: [0], kiro: [{}], log: '', ...overrides };
  const calls = { kiro: [], removed: 0, written: {}, routing: [] };
  const state = { attempt: -1 };
  const launch = async (command, args, { stdoutFile }) => {
    calls.kiro.push({ command, model: args[args.indexOf('--model') + 1] });
    const k = scenario.kiro[state.attempt] ?? {};
    const data = { status: 'success', finalText: k.text ?? 'Fait.' };
    calls.written[stdoutFile] = JSON.stringify({ type: 'runFinished', data });
    return { code: k.code ?? 0, stdout: '', stderr: k.stderr ?? '', timedOut: false };
  };
  const shell = async (cmd) =>
    cmd.startsWith('npm ci') ? ok() : { ...ok(), code: scenario.acceptance[state.attempt] ?? 0 };
  const fs = {
    mkdir: async () => {},
    appendFile: async (_, text) => calls.routing.push(JSON.parse(text)),
    writeFile: async (file, text) => (calls.written[file] = text),
  };
  const deps = {
    git: fakeGit(scenario, calls, state),
    launch,
    shell,
    fs,
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
