import { describe, expect, it } from 'vitest';
import { loadData, validateData } from '../src/data.mjs';
import { ToolError } from '../src/schemas.mjs';
import { closest, distance, getComponent, listComponents } from '../src/tools-components.mjs';
import { canonicalId, docsTools, normalize, termsOf } from '../src/tools-docs.mjs';
import { checkContrast, getTokens, roleOf } from '../src/tools-tokens.mjs';

const a11y = { keyboard: ['Tab'], screenReader: [], guaranteed: [], integrator: [] };
const component = (slug, group) => ({
  ...{ slug, title: slug, group, summary: `${slug} sert à…`, use: [], avoid: [], snippet: '' },
  ...{ a11y, props: [], tokens: [], evidence: [] },
});
const components = [component('button', 'forms'), component('stack', 'layout')];
const c = (l, hex) => ({ oklch: `oklch(${l})`, hex });
const pair = (fg, bg) => ({ '--pp-color-fg': fg, '--pp-color-bg': bg });
const tokens = {
  themes: {
    light: pair(c('21.5% 0.016 270.7', '#171921'), c('98.5% 0.004 270.7', '#f9fafd')),
    dark: pair(c('94.5% 0.008 270.7', '#ebedf2'), c('20.1% 0.0124 270.7', '#14161c')),
  },
  base: { '--pp-space-s': '1rem', '--pp-space-m': '1.5rem' },
  pairs: [{ fg: '--pp-color-fg', bg: '--pp-color-bg', min: 7, norm: 'WCAG 1.4.6 (AAA, texte)' }],
};
const doc = (title, body) => ({ path: `${title}.md`, title, url: `https://x/${title}/`, body });
const docs = [doc('Accessibilité', 'Focus.'), doc('Button', 'Focus, focus, accessibilite.')];
const adr = { id: 'ADR-0003', title: 'Serveur MCP', text: '# ADR-0003 — Serveur MCP\n\nstdio' };
const d021 = { id: 'D-021', date: 'd', decision: 'Budget INP', alternative: 'a', rollback: 'r' };
const decisions = { adrs: [adr], decisions: [d021] };
const tool = (name) => docsTools({ docs, decisions }).find((t) => t.name === name).run;

describe('list_components et get_component', () => {
  it('liste tout, filtre par groupe, refuse un groupe inconnu', () => {
    expect(listComponents(components).count).toBe(2);
    const [form] = listComponents(components, { group: 'forms' }).components;
    expect(Object.keys(form)).toEqual(['slug', 'title', 'group', 'summary']);
    expect(() => listComponents(components, { group: 'nope' })).toThrow(/forms, layout/);
  });

  it('fiche complète ; slug inconnu : slugs proches ou renvoi à list_components', () => {
    expect(getComponent(components, { slug: 'button' }).a11y.keyboard).toEqual(['Tab']);
    expect(() => getComponent(components, { slug: 'buton' })).toThrow(/proches : button/);
    expect(() => getComponent(components, { slug: 'zzzzzzzz' })).toThrow(/list_components/);
    expect(distance('kitten', 'sitting')).toBe(3);
    expect(closest('stak', ['stack', 'button', 'switch'])).toEqual(['stack']);
  });
});

describe('get_tokens et check_contrast', () => {
  it('filtre par rôle et par thème, contraste des paires connues', () => {
    expect(roleOf('--pp-color-status-passed')).toBe('color');
    const { themes, base } = getTokens(tokens, { role: 'color', theme: 'dark' });
    expect(Object.keys(themes)).toEqual(['dark']);
    expect(themes.dark.tokens.map((t) => t.hex)).toEqual(['#ebedf2', '#14161c']);
    expect(themes.dark.pairs[0]).toMatchObject({ min: 7, passes: true });
    expect(base).toEqual([]);
  });

  it('sans filtre : deux thèmes, jetons de base ; rôle inconnu ; check_contrast en clair', () => {
    const result = getTokens(tokens, {});
    expect(Object.keys(result.themes)).toEqual(['light', 'dark']);
    expect(result.base.map((t) => t.value)).toEqual(['1rem', '1.5rem']);
    expect(() => getTokens(tokens, { role: 'shadow' })).toThrow(/color, space/);
    const input = { foreground: '--pp-color-fg', background: '#fff' };
    expect(checkContrast(tokens, input).foreground.hex).toBe('#171921');
  });
});

describe('search_docs', () => {
  it('accents et casse normalisés, requête trop courte refusée, classement, limit', () => {
    expect(normalize('Accessibilité ÉLAN')).toBe('accessibilite elan');
    expect(termsOf('Le focus, a')).toEqual(['le', 'focus']);
    expect(() => termsOf('a ?')).toThrow(ToolError);
    // Occurrences, titre pondéré ; limit ; aucun résultat.
    const titles = tool('search_docs')({ query: 'accessibilité' }).results.map((r) => r.title);
    expect(titles).toEqual(['Accessibilité', 'Button']);
    const { results } = tool('search_docs')({ query: 'focus', limit: 1 });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ title: 'Button', url: 'https://x/Button/', score: 2 });
    expect(results[0].excerpt).toBe('Focus, focus, accessibilite.…');
    expect(tool('search_docs')({ query: 'introuvable' }).count).toBe(0);
  });
});

describe('get_decision', () => {
  it('identifiants canoniques, ADR, ligne du journal, recherche, inconnu', () => {
    expect([canonicalId('adr-3'), canonicalId('d-21')]).toEqual(['ADR-0003', 'D-021']);
    expect(tool('get_decision')({ id: 'ADR-0003' })).toMatchObject({ kind: 'adr', text: adr.text });
    expect(tool('get_decision')({ id: 'D-021' })).toMatchObject({ kind: 'decision', ...d021 });
    expect(tool('get_decision')({ query: 'inp' }).results.map((r) => r.id)).toEqual(['D-021']);
    expect(() => tool('get_decision')({ id: 'ADR-0009' })).toThrow(/ADR-0003, D-001 à D-021/);
  });
});

describe('data.mjs', () => {
  const valid = { components, tokens, decisions, docs };
  const keys = {
    'components.json': 'components',
    'tokens.json': 'tokens',
    'adr.json': 'decisions',
  };
  const reader = (overrides) => (url) => {
    const name = url.pathname.split('/').pop();
    const text = name in overrides ? overrides[name] : JSON.stringify(valid[keys[name] ?? 'docs']);
    if (text === undefined) throw new Error(`ENOENT: ${url.pathname}`);
    return text;
  };
  const load = (overrides) => () => loadData({ read: reader(overrides) });

  it('charge et valide les quatre fichiers', () => {
    expect(load({})().components).toHaveLength(2);
    expect(validateData(valid).docs).toHaveLength(2);
  });

  it('absentes, invalides, illisibles : message clair qui demande build:data, sans chemin', () => {
    expect(load({ 'docs.json': undefined })).toThrow(/absentes \(docs\.json\) : .*build:data/);
    expect(load({ 'docs.json': undefined })).not.toThrow(/ENOENT|\/data\/|file:/);
    expect(load({ 'tokens.json': '{}' })).toThrow(/invalides/);
    expect(load({ 'adr.json': '{' })).toThrow(/illisibles/);
  });
});
