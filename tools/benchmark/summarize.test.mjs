import { describe, expect, it } from 'vitest';
import { row, share } from './summarize.mjs';

const observed = (overrides = {}) => ({
  name: 'A',
  category: 'c',
  mobile: {
    targets: { atLeast44: 50, atLeast24: 90 },
    body: { fontSize: 16, charsPerLine: 40 },
    chrome: { bottomBar: false, menuButton: true },
    resources: { requests: 10, fontFiles: 2, fontKB: null },
    ...overrides,
  },
  desktop: {
    lightBackground: 'a',
    darkBackground: 'b',
    focus: { outline: true, boxShadow: false },
  },
});

describe('résumé des observations', () => {
  it('ligne d’un acteur observé : cibles, corps, sombre, focus, poids inconnu', () => {
    expect(row(observed())).toBe(
      '| A | c | 50 % / 90 % | 16 px / 40 cpl | non | oui | oui | oui | 10 req., 2 polices (? Ko) |',
    );
  });

  it('acteur non observé : la raison est écrite', () => {
    expect(row({ name: 'B', category: 'c', skipped: 'robots.txt' })).toMatch(
      /non observé : robots\.txt/,
    );
  });

  it('les parts ne comptent que les acteurs observés', () => {
    const sites = [observed(), observed({ body: { fontSize: 14 } }), { skipped: 'robots.txt' }];
    expect(share(sites, (site) => site.mobile.body.fontSize >= 16)).toBe('1/2');
  });
});
