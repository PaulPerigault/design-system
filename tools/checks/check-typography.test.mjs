import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  compileRules,
  failures,
  formatReport,
  run,
  scanHtml,
  scanText,
  summarize,
} from './check-typography.mjs';

const rules = compileRules();
const count = (name, text) => scanText(text, rules).filter((hit) => hit.rule === name).length;

/** [règle, vrai positif, faux positif] : une règle = un exemple de chaque. */
const CASES = [
  ['espace-avant-deux-points', 'Auteur : Paul', 'prefers-reduced-motion: reduce, 4,5:1'],
  ['espace-avant-ponctuation-double', 'vraiment ? oui ; non !', 'a ?.b, a ?? b, { href? }'],
  ['espace-avant-pourcentage', '47 % des cas', 'oklch(47% 0.1 270)'],
  ['espace-avant-unite', '24 px et 150 ms', '3 sections, 2 s’affichent'],
  ['espace-dans-millier', 'soit 1 161 cas', 'viewBox « 0 0 360 120 », 4,5 100'],
  ['guillemets-espace-secable', 'le mot « prouvé »', 'le mot « prouvé »'],
  ['apostrophe-droite', "l'ADR", 'l’ADR et la citation ‘a’'],
  ['deux-points-colle', 'Note: à lire', 'display: flex, prefers-reduced-motion: reduce'],
  ['pourcentage-colle', 'soit 47% des cas', 'oklch(47% 0.1 270) et calc(100%)'],
];

describe('règles', () => {
  it.each(CASES)('%s : détecte le vrai positif', (name, positive) => {
    expect(count(name, positive)).toBeGreaterThan(0);
  });
  it.each(CASES)('%s : ignore le faux positif', (name, _positive, negative) => {
    expect(count(name, negative)).toBe(0);
  });
  it('nomme chaque règle une seule fois', () => {
    expect(new Set(rules.map((r) => r.name)).size).toBe(rules.length);
  });
});

describe('scanHtml', () => {
  it('ignore le code, les blocs pre et le texte du dessin SVG', () => {
    const html = '<p>un : deux</p><code>a : b</code><pre>c : d</pre><svg><text>e : f</text></svg>';
    expect(scanHtml(html, rules)).toHaveLength(1);
  });
  it('lit aussi les attributs de texte', () => {
    expect(scanHtml('<a aria-label="un : deux">x</a>', rules)).toHaveLength(1);
  });
});

describe('summarize et failures', () => {
  const pageHits = [
    { page: 'a.html', hits: [{ rule: 'apostrophe-droite' }, { rule: 'apostrophe-droite' }] },
    { page: 'b.html', hits: [{ rule: 'apostrophe-droite' }] },
  ];
  const rows = summarize(pageHits, rules);
  const row = rows.find((r) => r.rule.name === 'apostrophe-droite');

  it('compte par règle, par page, et classe les pages', () => {
    expect(row).toMatchObject({ total: 3, pages: 2 });
    expect(row.top[0]).toEqual({ page: 'a.html', count: 2 });
  });
  it('ne bloque rien par défaut, une règle par option', () => {
    expect(failures(rows)).toEqual([]);
    expect(failures(rows, ['apostrophe-droite']).map((r) => r.rule.name)).toEqual([
      'apostrophe-droite',
    ]);
  });
  it('ne bloque pas une règle bloquante dont le compte est nul', () => {
    const strict = rows.map((r) => ({ ...r, rule: { ...r.rule, blocking: true } }));
    expect(failures(strict).map((r) => r.rule.name)).toEqual(['apostrophe-droite']);
  });
  it('écrit un tableau Markdown', () => {
    const report = formatReport(rows, 2);
    expect(report[0]).toBe('check-typography : 2 pages, 9 règles');
    expect(report.some((line) => line.startsWith('| apostrophe-droite | 3 | 2 |'))).toBe(true);
  });
});

describe('run', () => {
  it('lit les pages de dist, hors pagefind, et sort sans échec', () => {
    const root = mkdtempSync(join(tmpdir(), 'typo-'));
    mkdirSync(join(root, 'dist', 'pagefind'), { recursive: true });
    writeFileSync(join(root, 'dist', 'index.html'), '<p>Auteur : Paul</p>');
    writeFileSync(join(root, 'dist', 'pagefind', 'x.html'), '<p>a : b</p>');
    const { rows, pageCount, failed } = run(root, { dist: 'dist' });
    expect(pageCount).toBe(1);
    expect(rows.find((r) => r.rule.name === 'espace-avant-deux-points').total).toBe(1);
    expect(failed).toEqual([]);
    expect(run(root, { dist: 'dist', blocked: ['espace-avant-deux-points'] }).failed).toHaveLength(
      1,
    );
    rmSync(root, { recursive: true });
  });
});
