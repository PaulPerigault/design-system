// Hook PreToolUse de Claude Code (Bash et PowerShell) : toute commande `gh pr merge` n'est admise
// que si elle vise une PR numérotée dont la base réelle, lue par `gh pr view`, est `main`, et dont la branche n'est pas celle de release-please (sa fusion publie :
// geste du propriétaire). PR sans numéro, base illisible ou autre base = blocage (code 2, raison sur stderr).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const BLOCK = 2;
const GH_TIMEOUT_MS = 15_000;
const RELEASE_BRANCH = /^release-please--/;
const SEGMENT_SEPARATORS = /&&|\|\||[;|\n]/;
const MERGE = /(?:^|[\s/(])gh(?:\.exe)?\s+(.*?\bpr\s+merge\b.*)$/;
const REPO_FLAG = /(?:^|\s)(?:-R|--repo)(?:=|\s+)(\S+)/;
const PR_URL = /github\.com\/([^/\s]+\/[^/\s]+)\/pull\/(\d+)/;
const PR_NUMBER = /\bmerge\b(?:\s+-{1,2}\S+(?:\s+(?!\d+\b)\S+)?)*\s+(\d+)\b/;

/** Arguments `gh … pr merge …` de chaque segment de la commande qui fusionne une PR. */
export function mergeSegments(command) {
  return command
    .split(SEGMENT_SEPARATORS)
    .map((segment) => MERGE.exec(segment.replace(/["']/g, ' '))?.[1])
    .filter((args) => args !== undefined);
}

/** PR visée par des arguments de fusion : `{ pr, repo }`, ou null sans numéro. */
export function targetOf(args) {
  const url = PR_URL.exec(args);
  if (url) return { pr: url[2], repo: url[1] };
  const pr = PR_NUMBER.exec(args)?.[1];
  return pr ? { pr, repo: REPO_FLAG.exec(args)?.[1] ?? null } : null;
}

/** `{ base, head }` de la PR lue sur GitHub, ou null si gh échoue (réseau, PR inconnue, droits). */
function readPrWithGh({ pr, repo }) {
  const args = [
    'pr',
    'view',
    pr,
    '--json',
    'baseRefName,headRefName',
    '--jq',
    '[.baseRefName,.headRefName]|@tsv',
  ];
  if (repo) args.push('--repo', repo);
  try {
    const opts = { encoding: 'utf8', timeout: GH_TIMEOUT_MS, stdio: 'pipe' };
    const [base, head] = execFileSync('gh', args, opts).trim().split('	');
    return base ? { base, head: head ?? '' } : null;
  } catch {
    return null;
  }
}

/** Raison du refus pour une PR lue (base et branche), ou null si sa fusion est admise. */
function prRefusal(number, pr) {
  if (pr?.base !== 'main') {
    return `Fusion refusée : la PR #${number} vise « ${pr?.base ?? 'illisible'} » ; seul main est admis.`;
  }
  if (RELEASE_BRANCH.test(pr.head)) {
    return `Fusion refusée : la PR #${number} est une PR de release, geste du propriétaire.`;
  }
  return null;
}

/**
 * @param {string} command commande complète
 * @param {(target: { pr: string, repo: string | null }) => { base: string, head: string } | null} readPr
 *   lecture injectée
 * @returns {string | null} raison du refus, ou null si la commande est admise
 */
export function mergeRefusal(command, readPr = readPrWithGh) {
  for (const args of mergeSegments(command)) {
    const target = targetOf(args);
    if (!target) return 'Fusion refusée : citer le numéro de la PR (gh pr merge <n>).';
    const refusal = prRefusal(target.pr, readPr(target));
    if (refusal) return refusal;
  }
  return null;
}

/** @returns {string | null} raison du refus pour un événement de hook (JSON brut) */
export function decide(rawEvent, readPr = readPrWithGh) {
  let command;
  try {
    command = JSON.parse(rawEvent)?.tool_input?.command;
  } catch {
    return 'Événement de hook illisible : commande refusée par prudence.';
  }
  return typeof command === 'string' ? mergeRefusal(command, readPr) : null;
}

if (import.meta.main) {
  const reason = decide(readFileSync(0, 'utf8'));
  if (reason) {
    process.stderr.write(`${reason}\n`);
    process.exit(BLOCK);
  }
}
