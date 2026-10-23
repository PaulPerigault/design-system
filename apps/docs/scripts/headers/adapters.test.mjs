import { describe, expect, it } from 'vitest';
import { renderHeaders, renderRedirects } from './cloudflare.mjs';
import { render as netlify } from './netlify.mjs';
import { render as nginx } from './nginx.mjs';
import { REDIRECTS, REQUIRED_HEADERS, buildRules } from './policy.mjs';
import { render as vercel } from './vercel.mjs';

const hashes = { styleHashes: ["'sha256-AAA='"], scriptHashes: ["'sha256-BBB='"] };
const rules = buildRules(hashes);
const csp = rules[0].headers.find(([name]) => name === 'Content-Security-Policy')[1];
const TRICKY = 'a "quoted" b; c\\d';
const trickyRules = [{ path: '/*', headers: [['X-Test', TRICKY]] }];

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const lineValue = (out, pattern) => out.match(new RegExp(pattern, 'm'))?.[1];

const adapters = {
  cloudflare: {
    out: (r, d) => `${renderHeaders(r)}\n${renderRedirects(d)}`,
    get: (out, name) => lineValue(out, `^  ${escapeRe(name)}: (.*)$`),
    redirect: (out) => out.includes('/index.html / 301'),
  },
  netlify: {
    out: netlify,
    get(out, name) {
      const raw = lineValue(out, `^ +"${escapeRe(name)}" = (".*")$`);
      return raw === undefined ? undefined : JSON.parse(raw);
    },
    redirect: (out) =>
      /from = "\/index\.html"\n {2}to = "\/"\n {2}status = 301\n {2}force = true/.test(out),
  },
  vercel: {
    out: (r, d) => JSON.stringify(vercel(r, d)),
    get: (out, name) =>
      JSON.parse(out)
        .headers.flatMap((rule) => rule.headers)
        .find((header) => header.key === name)?.value,
    redirect: (out) =>
      JSON.parse(out).redirects.some(
        (r) => r.source === '/index.html' && r.destination === '/' && r.statusCode === 301,
      ),
  },
  nginx: {
    out: nginx,
    get(out, name) {
      const raw = lineValue(out, `add_header ${escapeRe(name)} "(.*)" always;`);
      return raw?.replace(/\\(["\\])/g, '$1');
    },
    redirect: (out) => out.includes('location = /index.html') && out.includes('return 301 /;'),
  },
};

describe.each(Object.entries(adapters))('adaptateur %s', (_name, adapter) => {
  const out = adapter.out(rules, REDIRECTS);

  it.each(REQUIRED_HEADERS)('contient %s', (header) => {
    expect(adapter.get(out, header)).toBeDefined();
  });

  it('restitue la CSP à l’identique', () => {
    expect(adapter.get(out, 'Content-Security-Policy')).toBe(csp);
  });

  it('rend /_astro/* immutable', () => {
    expect(adapter.get(out, 'Cache-Control')).toContain('immutable');
  });

  it('redirige /index.html vers /', () => {
    expect(adapter.redirect(out)).toBe(true);
  });

  it('échappe guillemets, point-virgule et antislash', () => {
    const tricky = adapter.out(trickyRules, []);
    expect(adapter.get(tricky, 'X-Test')).toBe(TRICKY);
  });
});

describe('formats spécifiques', () => {
  it('cloudflare : chemin sans indentation, lignes vides entre règles', () => {
    const text = renderHeaders(rules);
    expect(text.startsWith('/*\n  Strict-Transport-Security: ')).toBe(true);
    expect(text).toContain('\n\n/_astro/*\n  Cache-Control: ');
  });

  it('vercel : sources path-to-regexp et options', () => {
    const json = vercel(rules, REDIRECTS);
    expect(json.headers.map((h) => h.source)).toEqual(['/(.*)', '/_astro/(.*)']);
    expect(json).toMatchObject({ trailingSlash: true, cleanUrls: false });
  });

  it('nginx : en-têtes de /* répétés dans /_astro/', () => {
    const block = nginx(rules, REDIRECTS).split('location /_astro/ {')[1].split('  }')[0];
    expect(block).toContain('add_header Content-Security-Policy');
    expect(block).toContain('add_header Cache-Control');
  });
});
