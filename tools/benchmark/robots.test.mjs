import { describe, expect, it } from 'vitest';
import { allowed, robotsAllows, starGroup } from './robots.mjs';

const TEXT = `User-agent: Googlebot\nDisallow: /\n\nUser-agent: *\nDisallow: /search\nAllow: /search/about\nDisallow: /*.pdf$\n`;

describe('robots.txt', () => {
  it('ne lit que le groupe *', () => {
    expect(starGroup(TEXT)).toEqual({ allow: ['/search/about'], disallow: ['/search', '/*.pdf$'] });
  });

  it('la règle la plus longue l’emporte, jokers et ancre de fin', () => {
    const rules = starGroup(TEXT);
    expect(allowed(rules, '/')).toBe(true);
    expect(allowed(rules, '/search?q=a')).toBe(false);
    expect(allowed(rules, '/search/about')).toBe(true);
    expect(allowed(rules, '/doc/a.pdf')).toBe(false);
  });

  it('absent (404) : permis ; erreur serveur ou réseau : refusé', async () => {
    const reply = (status) => async () => new Response('', { status });
    expect(await robotsAllows('https://a.test/', reply(404))).toBe(true);
    expect(await robotsAllows('https://a.test/', reply(503))).toBe(false);
    expect(await robotsAllows('https://a.test/', () => Promise.reject(new Error('x')))).toBe(false);
  });
});
