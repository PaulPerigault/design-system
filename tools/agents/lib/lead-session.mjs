// Une session de ds-lead sur un lot : worktree dédié (`<ds-wt>/lead`) sur la branche `lot/<id>`
// (créée depuis sa base si elle n'existe pas, empilable : base `lot/L8`), dépendances par amorce,
// puis Kiro (`ds-lead`, claude-opus-5.5, effort high) sous une place du sémaphore.
import { join } from 'node:path';
import { executorEnv } from './env.ts';
import { kiroArgs, runAgent } from './transports.mjs';

export const LEAD_MODEL = 'claude-opus-5.5';
export const LEAD_TIMEOUT_MS = 4 * 60 * 60 * 1000;
const LEAD_TOOLS = ['read', 'write', 'shell'];

const must = async (git, args, cwd) => {
  const result = await git(args, { cwd });
  if (result.code !== 0)
    throw new Error(`git ${args.join(' ')} : ${result.stderr || result.stdout}`);
  return result.stdout.trim();
};

/** Prépare le worktree de ds-lead sur `lot/<id>` ; renvoie son chemin. */
export async function prepareLeadWorktree(deps, lot) {
  const path = join(deps.config.worktreeRoot, 'lead');
  const branch = `lot/${lot.id}`;
  const exists =
    (await deps.git(['rev-parse', '--verify', '--quiet', branch], { cwd: deps.stateRoot })).code ===
    0;
  const hasWorktree =
    (await deps.git(['-C', path, 'rev-parse', '--git-dir'], { cwd: deps.stateRoot })).code === 0;
  if (!hasWorktree) {
    await must(deps.git, ['worktree', 'add', '--detach', path, lot.base], deps.stateRoot);
  }
  await must(deps.git, ['switch', ...(exists ? [branch] : ['-c', branch, lot.base])], path);
  const installed = await deps.install({
    cwd: path,
    env: deps.env,
    timeoutMs: deps.config.acceptanceTimeoutMs,
  });
  if (installed.code !== 0)
    throw new Error(`installation du worktree de ds-lead : ${installed.stderr}`);
  return path;
}

/** Prompt de la session : rôle (prompts/lead.md), lot, file, règles de fin. */
export function leadPrompt(lot, queueFile) {
  return [
    `# Lot ${lot.id} confié à ds-lead`,
    'Lis `prompts/lead.md` (ton rôle), `AGENTS.md`, `docs/kickoff.md` et les bilans `docs/lots/` avant de commencer.',
    `Branche de travail (déjà sélectionnée) : \`lot/${lot.id}\`, partie de \`${lot.base}\`.`,
    `File de travail : \`${queueFile}\` (section \`## ${lot.id}\`).`,
    `## Spécification du lot\n\n${lot.body}`,
    `## Fin du lot\n\nQuand tout est intégré et que \`npm run verify\` et \`npm run e2e\` passent, écris \`docs/lots/${lot.id}.md\`, puis remplace \`statut : en cours\` par \`statut : prêt pour validation\` dans l'en-tête de la section \`## ${lot.id}\` de la file. Ne modifie aucune autre section.`,
  ].join('\n\n');
}

/** Lance la session Kiro de ds-lead ; renvoie le résumé du flux. */
export async function runLeadSession(deps, { lot, cwd, queueFile, attempt }) {
  const file = (suffix) =>
    join(deps.stateRoot, deps.config.runsDir, `lead-${lot.id}-a${attempt}${suffix}`);
  const args = kiroArgs({
    agent: 'ds-lead',
    model: LEAD_MODEL,
    effort: 'high',
    trustTools: LEAD_TOOLS,
    prompt: leadPrompt(lot, queueFile),
  });
  const env = executorEnv(deps.env, { emptyNpmrc: deps.emptyNpmrc, hookLog: file('.hook.jsonl') });
  const release = await deps.slot();
  return runAgent({
    launch: deps.launch,
    engine: 'kiro',
    cwd,
    env,
    timeoutMs: LEAD_TIMEOUT_MS,
    args,
    stdoutFile: file('.jsonl'),
    stderrFile: file('.stderr.log'),
  }).finally(() => release());
}

/** Commite (hooks actifs) les seuls fichiers que ds-lead écrit lui-même : tâches et bilan. */
export async function commitLeadFiles(deps, { cwd, lot }) {
  await deps.git(['add', '--', 'tasks', 'docs/lots'], { cwd });
  const staged = await deps.git(['diff', '--cached', '--name-only'], { cwd });
  if (!staged.stdout.trim()) return [];
  await must(
    deps.git,
    ['commit', '-m', `chore(lot): tâches et bilan du lot ${lot.id.toLowerCase()}`],
    cwd,
  );
  return staged.stdout.trim().split('\n');
}
