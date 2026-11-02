// Contrôle d'orthotypographie française sur le texte rendu de `apps/docs/dist` (hors code, pre,
// kbd, svg). Mesure d'abord : sort 0 ; une règle bloque si `blocking` ou `--block=<nom>,<nom>`.
import { appendFileSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { mapText } from '../typography/html-text.mjs';
import { walk } from './walk.mjs';
import rulesFile from './typography-rules.json' with { type: 'json' };

const DIST = 'apps/docs/dist';
const CONTEXT = 20;
const TOP_PAGES = 5;

/** @returns {{ name: string, description: string, re: RegExp, except: RegExp[], blocking: boolean }[]} */
export function compileRules(config = rulesFile) {
  return config.rules.map((rule) => ({
    ...rule,
    re: new RegExp(rule.pattern, 'gu'),
    except: (rule.except ?? []).map((source) => new RegExp(source, 'u')),
    blocking: rule.blocking === true,
  }));
}

/** Occurrences d'une règle dans un texte, hors exceptions : `{ rule, context }`. */
export function scanText(text, rules) {
  return rules.flatMap((rule) =>
    [...text.matchAll(rule.re)]
      .map((m) => ({
        rule: rule.name,
        context: text.slice(Math.max(0, m.index - CONTEXT), m.index + m[0].length + CONTEXT),
      }))
      .filter((hit) => !rule.except.some((except) => except.test(hit.context))),
  );
}

/** Occurrences d'une page HTML. */
export function scanHtml(html, rules) {
  const hits = [];
  mapText(html, (text) => {
    hits.push(...scanText(text, rules));
    return text;
  });
  return hits;
}

/** Compte par règle : `{ total, pages }`, plus les pages les plus touchées. */
export function summarize(pageHits, rules) {
  return rules.map((rule) => {
    const perPage = pageHits
      .map(({ page, hits }) => ({ page, count: hits.filter((h) => h.rule === rule.name).length }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count);
    const total = perPage.reduce((sum, entry) => sum + entry.count, 0);
    return { rule, total, pages: perPage.length, top: perPage.slice(0, TOP_PAGES) };
  });
}

/** Règles à la fois bloquantes et non nulles. */
export const failures = (rows, blocked = []) =>
  rows.filter((row) => row.total > 0 && (row.rule.blocking || blocked.includes(row.rule.name)));

export function formatReport(rows, pageCount) {
  const head = `check-typography : ${pageCount} pages, ${rows.length} règles`;
  const lines = rows.map((row) => {
    const mode = row.rule.blocking ? 'bloquant' : 'mesure';
    return `| ${row.rule.name} | ${row.total} | ${row.pages} | ${mode} | ${row.rule.description} |`;
  });
  return [
    head,
    '',
    '| règle | total | pages | mode | description |',
    '|---|---|---|---|---|',
    ...lines,
  ];
}

export function run(root = process.cwd(), options = {}) {
  const { dist = DIST, read = (file) => readFileSync(file, 'utf8'), blocked = [] } = options;
  const rules = compileRules();
  const files = walk(resolve(root, dist), ['.html']).filter((f) => !f.includes('pagefind'));
  const pageHits = files.map((file) => ({
    page: relative(resolve(root, dist), file),
    hits: scanHtml(read(file), rules),
  }));
  const rows = summarize(pageHits, rules);
  return { rows, pageCount: files.length, failed: failures(rows, blocked) };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const value = (flag) => args.find((a) => a.startsWith(`--${flag}=`))?.split('=')[1];
  const { rows, pageCount, failed } = run(process.cwd(), {
    dist: value('dist') ?? DIST,
    blocked: (value('block') ?? '').split(',').filter(Boolean),
  });
  const report = formatReport(rows, pageCount).join('\n');
  console.log(report);
  for (const row of rows.filter((r) => r.total > 0))
    console.log(`  ${row.rule.name} : ${row.top.map((t) => `${t.page} (${t.count})`).join(', ')}`);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
  process.exit(failed.length > 0 ? 1 : 0);
}
