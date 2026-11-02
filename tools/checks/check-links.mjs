// Contrôle des liens de `apps/docs/dist` (#212). Liens internes et ancres : BLOQUANT, 0 attendu.
// Liens externes (`--external`) : mesure dans le résumé du job, jamais bloquante (D-127).
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { extractLinks } from '../links/html-refs.mjs';
import { distinctExternal, fetchHead, measureExternal } from '../links/external.mjs';
import { internalProblems } from '../links/internal.mjs';
import { externalReport, internalReport } from '../links/report.mjs';
import { classify } from '../links/resolve.mjs';
import { walk } from './walk.mjs';
import config from '../links/config.json' with { type: 'json' };

const DIST = 'apps/docs/dist';
const toKey = (dist, file) => relative(dist, file).replaceAll('\\', '/');

/** Pages HTML de `dist` (hors Pagefind) et fonctions de lecture sur le disque. */
export function loadSite(root = process.cwd(), dist = DIST) {
  const base = resolve(root, dist);
  const files = walk(base, ['.html']).filter((file) => !file.includes('pagefind'));
  const pages = files.map((file) => ({
    page: toKey(base, file),
    html: readFileSync(file, 'utf8'),
  }));
  const exists = (file) => existsSync(resolve(base, file));
  return { pages, exists, read: (file) => readFileSync(resolve(base, file), 'utf8') };
}

/** Problèmes internes de toutes les pages. */
export function checkInternal(site, settings = config) {
  const context = {
    ...site,
    origins: settings.origins,
    exceptions: settings.exceptions,
    cache: new Map(),
  };
  return site.pages.flatMap((page) => internalProblems(page, context));
}

/** URL externes distinctes de toutes les pages. */
export function externalUrls(site, settings = config) {
  const urls = site.pages
    .flatMap(({ page, html }) => extractLinks(html).map(({ url }) => ({ url, page })))
    .filter(({ url, page }) => classify(url, page, settings.origins).kind === 'external')
    .map(({ url }) => url);
  return distinctExternal(urls, settings.ignoredHosts);
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const dist = args.find((arg) => arg.startsWith('--dist='))?.split('=')[1] ?? DIST;
  const site = loadSite(process.cwd(), dist);
  const problems = checkInternal(site);
  const lines = internalReport(problems, site.pages.length);
  if (args.includes('--external')) {
    const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
    const results = await measureExternal(externalUrls(site), { fetchStatus: fetchHead, sleep });
    lines.push('', ...externalReport(results));
  }
  console.log(lines.join('\n'));
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
  process.exit(problems.length > 0 ? 1 : 0);
}
