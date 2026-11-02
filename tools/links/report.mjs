// Mise en forme du résultat du contrôle des liens, pour le terminal et le résumé du job.
const MAX_LISTED = 50;

/** @returns {string[]} lignes de rapport pour les liens internes */
export function internalReport(problems, pageCount) {
  const head = `check-links : ${pageCount} pages, ${problems.length} lien(s) interne(s) cassé(s)`;
  if (problems.length === 0) return [head];
  const rows = problems
    .slice(0, MAX_LISTED)
    .map(({ page, url, problem }) => `| ${page} | \`${url}\` | ${problem} |`);
  const more = problems.length > MAX_LISTED ? [`… et ${problems.length - MAX_LISTED} de plus`] : [];
  return [head, '', '| page | lien | manque |', '|---|---|---|', ...rows, ...more];
}

/** @returns {string[]} lignes de rapport pour les liens externes (mesure, jamais bloquante) */
export function externalReport(results) {
  const bad = results.filter((entry) => entry.note !== 'ok');
  const head = `Liens externes (mesure) : ${results.length} URL, ${bad.length} à vérifier`;
  if (bad.length === 0) return [head];
  const rows = bad.map(({ url, status, note }) => `| ${url} | ${status ?? '-'} | ${note} |`);
  return [head, '', '| URL | statut | note |', '|---|---|---|', ...rows];
}
