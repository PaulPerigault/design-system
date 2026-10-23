import { describe, expect, it } from 'vitest';
import {
  REDIRECTS,
  REQUIRED_HEADERS,
  buildRules,
  contentSecurityPolicy,
  securityHeaders,
} from './policy.mjs';

const hashes = { styleHashes: ["'sha256-AAA='"], scriptHashes: ["'sha256-BBB='"] };
const directives = (csp) => Object.fromEntries(csp.split('; ').map((d) => [d.split(' ')[0], d]));

describe('contentSecurityPolicy', () => {
  const csp = contentSecurityPolicy(hashes);
  const parsed = directives(csp);

  it.each([
    ['default-src', "default-src 'none'"],
    ['img-src', "img-src 'self' data:"],
    ['font-src', "font-src 'self'"],
    ['connect-src', "connect-src 'self'"],
    ['manifest-src', "manifest-src 'self'"],
    ['worker-src', "worker-src 'self'"],
    ['base-uri', "base-uri 'none'"],
    ['form-action', "form-action 'self'"],
    ['frame-ancestors', "frame-ancestors 'none'"],
    ['object-src', "object-src 'none'"],
    ['upgrade-insecure-requests', 'upgrade-insecure-requests'],
  ])('contient %s', (name, expected) => {
    expect(parsed[name]).toBe(expected);
  });

  it('injecte les hachages au bon endroit', () => {
    expect(parsed['script-src']).toBe("script-src 'self' 'wasm-unsafe-eval' 'sha256-BBB='");
    expect(parsed['style-src']).toBe("style-src 'self' 'sha256-AAA='");
  });

  it('exclut les valeurs interdites', () => {
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toMatch(/(^|\s)(\*|https:)(\s|;|$)/);
  });
});

describe('securityHeaders', () => {
  const map = new Map(securityHeaders());

  it('fixe les valeurs attendues', () => {
    expect(map.get('Strict-Transport-Security')).toBe('max-age=63072000; includeSubDomains');
    expect(map.get('X-Content-Type-Options')).toBe('nosniff');
    expect(map.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(map.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(map.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
    expect(map.get('Cross-Origin-Embedder-Policy')).toBe('require-corp');
    expect(map.get('X-Frame-Options')).toBe('DENY');
    expect(map.get('X-Permitted-Cross-Domain-Policies')).toBe('none');
  });

  it('refuse les API sensibles sauf fullscreen', () => {
    const policy = map.get('Permissions-Policy');
    expect(policy).toContain('camera=()');
    expect(policy).toContain('usb=()');
    expect(policy).toContain('fullscreen=(self)');
  });

  it('n’active pas preload', () => {
    expect(map.get('Strict-Transport-Security')).not.toContain('preload');
  });
});

describe('buildRules', () => {
  const rules = buildRules(hashes);
  const all = rules.find((rule) => rule.path === '/*');
  const assets = rules.find((rule) => rule.path === '/_astro/*');

  it('couvre tous les en-têtes requis sur /*', () => {
    const names = all.headers.map(([name]) => name);
    expect(names).toEqual(expect.arrayContaining(REQUIRED_HEADERS));
  });

  it('place les hachages dans la CSP de /*', () => {
    const csp = all.headers.find(([name]) => name === 'Content-Security-Policy')[1];
    expect(csp).toContain("'sha256-AAA='");
    expect(csp).toContain("'sha256-BBB='");
  });

  it('rend /_astro/* immuable', () => {
    expect(assets.headers).toEqual([['Cache-Control', 'public, max-age=31536000, immutable']]);
  });

  it('ne pose pas de Cache-Control sur /* (cumul des règles chez Cloudflare et Netlify)', () => {
    expect(all.headers.map(([name]) => name)).not.toContain('Cache-Control');
  });
});

describe('REDIRECTS', () => {
  it('redirige /index.html vers /', () => {
    expect(REDIRECTS).toEqual([{ from: '/index.html', to: '/', status: 301 }]);
  });
});
