// Contrôle mensuel des skills tiers : lecture seule. Compare le SHA relu de chaque
// dépôt source (tableau « Suivi amont » du registre) au SHA courant de son amont, via l'API
// publique de GitHub, sans jeton. Affiche les dépôts changés ou indisponibles ; ne modifie rien,
// n'échoue jamais (information, non verrou). Un amont injoignable se voit au compte.
import { appendFileSync, readFileSync } from 'node:fs';

const REGISTRY = 'docs/design/skills-registre.md';
const SECTION = '## Suivi amont';
const SHA = /^[0-9a-f]{40}$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const TIMEOUT_MS = 10_000;
const SHORT = 8;

/** @returns {{skill: string, repo: string, sha: string}[]} lignes valides du tableau de suivi */
export function parseTracking(markdown) {
  const start = markdown.indexOf(SECTION);
  if (start === -1) return [];
  const rest = markdown.slice(start + SECTION.length);
  const end = rest.search(/\n## /);
  const rows = (end === -1 ? rest : rest.slice(0, end)).split('\n');
  return rows
    .map((row) => row.split('|').map((cell) => cell.trim().replaceAll('`', '')))
    .filter((cells) => cells.length >= 5 && cells[1].startsWith('encre-'))
    .map(([, skill, repo, sha]) => ({ skill, repo, sha }))
    .filter((entry) => REPO.test(entry.repo) && SHA.test(entry.sha));
}

/** @returns {Promise<object[]>} un résultat par ligne : inchangé, changé ou indisponible */
export async function compareAll(entries, fetchHead) {
  const heads = new Map();
  for (const repo of new Set(entries.map((entry) => entry.repo))) {
    heads.set(repo, await fetchHead(repo).catch((error) => ({ error: String(error.message) })));
  }
  return entries.map((entry) => {
    const head = heads.get(entry.repo);
    if (typeof head !== 'string') return { ...entry, status: 'indisponible', detail: head.error };
    if (!SHA.test(head)) return { ...entry, status: 'indisponible', detail: 'SHA illisible' };
    return { ...entry, head, status: head === entry.sha ? 'inchangé' : 'changé' };
  });
}

/** @returns {string[]} tableau Markdown du résultat, pour le terminal et le résumé du job */
export function report(results) {
  const changed = results.filter((result) => result.status === 'changé');
  const unavailable = results.filter((result) => result.status === 'indisponible').length;
  const lines = [
    `Skills suivis : ${results.length}, SHA changés : ${changed.length}, indisponibles : ${unavailable}.`,
    '',
    '| Skill | Dépôt | Relu | Courant | État |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const r of results) {
    const head = r.head ? r.head.slice(0, SHORT) : (r.detail ?? '');
    lines.push(`| ${r.skill} | ${r.repo} | ${r.sha.slice(0, SHORT)} | ${head} | ${r.status} |`);
  }
  for (const r of changed) {
    lines.push('', `À relire : https://github.com/${r.repo}/compare/${r.sha}...${r.head}`);
  }
  return lines;
}

async function fetchHead(repo) {
  const response = await fetch(`https://api.github.com/repos/${repo}/commits/HEAD`, {
    headers: { Accept: 'application/vnd.github.sha', 'User-Agent': 'ds-check-upstream' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.text()).trim();
}

if (import.meta.main) {
  const entries = parseTracking(readFileSync(REGISTRY, 'utf8'));
  const text = report(await compareAll(entries, fetchHead)).join('\n');
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
}
