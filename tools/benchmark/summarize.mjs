// Résumé des observations en tableau Markdown et en convergences chiffrées.
// Usage : node tools/benchmark/summarize.mjs docs/benchmark/observations/observations.json
import { readFileSync } from 'node:fs';

const yes = (value) => (value ? 'oui' : 'non');

const reasonOf = (site) => site.skipped ?? site.mobile?.blocked ?? site.mobile?.error;
const bodyOf = ({ body }) => (body ? `${body.fontSize} px / ${body.charsPerLine ?? '—'} cpl` : '—');
const darkOf = (desktop) =>
  Boolean(desktop?.darkBackground) && desktop.darkBackground !== desktop.lightBackground;
const focusOf = (desktop) =>
  desktop?.focus ? yes(desktop.focus.outline || desktop.focus.boxShadow) : '—';

/** Ligne de tableau d'un acteur ; une page bloquée ou refusée le dit. */
export function row(site) {
  const reason = reasonOf(site);
  if (reason)
    return `| ${site.name} | ${site.category} | non observé : ${reason.slice(0, 60)} | | | | | |`;
  const { mobile, desktop } = site;
  return [
    `| ${site.name} | ${site.category}`,
    `${mobile.targets.atLeast44} % / ${mobile.targets.atLeast24} %`,
    bodyOf(mobile),
    yes(mobile.chrome.bottomBar),
    yes(mobile.chrome.menuButton),
    yes(darkOf(desktop)),
    focusOf(desktop),
    `${mobile.resources.requests} req., ${mobile.resources.fontFiles} polices (${mobile.resources.fontKB ?? '?'} Ko) |`,
  ].join(' | ');
}

/** Part des acteurs observés qui vérifient un prédicat. */
export function share(sites, predicate) {
  const observed = sites.filter(
    (site) => site.mobile && !site.mobile.blocked && !site.mobile.error,
  );
  const count = observed.filter(predicate).length;
  return `${count}/${observed.length}`;
}

if (import.meta.main) {
  const { observedAt, results } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  console.log(`Observé le ${observedAt.slice(0, 10)}.\n`);
  console.log(
    '| Acteur | Catégorie | Cibles ≥ 44 / ≥ 24 px (mobile) | Corps mobile | Barre en bas | Bouton de menu | Sombre suivi | Focus visible | Poids |',
  );
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const site of results) console.log(row(site));
  console.log('\nConvergences (acteurs observés) :');
  console.log(
    `- corps ≥ 16 px sur mobile : ${share(results, (s) => (s.mobile.body?.fontSize ?? 0) >= 16)}`,
  );
  console.log(
    `- barre de navigation fixe en bas : ${share(results, (s) => s.mobile.chrome.bottomBar)}`,
  );
  console.log(`- bouton de menu : ${share(results, (s) => s.mobile.chrome.menuButton)}`);
  console.log(`- en-tête collant : ${share(results, (s) => s.mobile.chrome.stickyHeader)}`);
  console.log(`- viewport-fit=cover : ${share(results, (s) => s.mobile.chrome.viewportFitCover)}`);
  console.log(
    `- zoom bloqué (1.4.4) : ${share(results, (s) => s.mobile.chrome.userScalableBlocked)}`,
  );
  console.log(
    `- ≥ 80 % des cibles ≥ 24 px : ${share(results, (s) => s.mobile.targets.atLeast24 >= 80)}`,
  );
  console.log(
    `- ≥ 50 % des cibles ≥ 44 px : ${share(results, (s) => s.mobile.targets.atLeast44 >= 50)}`,
  );
  console.log(`- mode sombre suivi : ${share(results, (s) => darkOf(s.desktop))}`);
  console.log(
    `- focus visible à la 1re tabulation : ${share(results, (s) => s.desktop?.focus && (s.desktop.focus.outline || s.desktop.focus.boxShadow))}`,
  );
}
