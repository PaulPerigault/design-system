import { describe, expect, it, vi } from 'vitest';
import {
  checkReciprocal,
  crossLinksActive,
  findNodes,
  personProblems,
  reciprocalLinkState,
  websiteProblems,
} from './cross-links.ts';
import type { FetchLike } from './cross-links.ts';
import { personLd, websiteLd } from './seo.ts';
import { SITE_URL } from './site.ts';

const WITH_LINK = `<!doctype html><footer><a class="x" href="${SITE_URL}/">Design system</a></footer>`;
const WITHOUT_LINK = '<p><a href="https://github.com/PaulPerigault">GitHub</a></p>';

const pageOf =
  (html: string): FetchLike =>
  async () => ({ ok: true, text: async () => html });

describe('crossLinksActive', () => {
  it('actif seulement pour la valeur exacte 1', () => {
    expect(crossLinksActive('1')).toBe(true);
    for (const flag of ['0', '', 'true', undefined]) expect(crossLinksActive(flag)).toBe(false);
  });
});

describe('reciprocalLinkState', () => {
  it.each([
    WITH_LINK,
    `<a href='${SITE_URL}'>x</a>`,
    `<a href=${SITE_URL}/composants/>x</a>`,
    `<a target="_blank"\n href="${SITE_URL}/">x</a>`,
  ])('lien présent : %s', (html) => {
    expect(reciprocalLinkState(html, SITE_URL)).toBe('present');
  });

  it.each([WITHOUT_LINK, ''])('lien absent : %j', (html) => {
    expect(reciprocalLinkState(html, SITE_URL)).toBe('absent');
  });

  it.each([
    ['du texte', `<p>${SITE_URL}</p>`],
    ['un commentaire', `<!-- <a href="${SITE_URL}/">x</a> -->`],
    ['un lien relatif', '<a href="/design/">x</a>'],
    ['un hôte voisin', `<a href="${SITE_URL}.evil.example/">x</a>`],
    ['http', '<a href="http://design.paulperigault.dev/">x</a>'],
  ])('ignore %s', (_name, html) => {
    expect(reciprocalLinkState(html, SITE_URL)).toBe('absent');
  });

  it('refuse une adresse de site invalide', () => {
    expect(reciprocalLinkState(WITH_LINK, 'pas une url')).toBe('absent');
  });
});

describe('checkReciprocal (fetch injecté)', () => {
  it.each([
    [WITH_LINK, 'present'],
    [WITHOUT_LINK, 'absent'],
  ])('page lue : %j', async (html, state) => {
    expect(await checkReciprocal(pageOf(html))).toBe(state);
  });

  it('erreur réseau', async () => {
    const failing: FetchLike = async () => {
      throw new TypeError('fetch failed');
    };
    expect(await checkReciprocal(failing)).toBe('unreachable');
  });

  it('statut HTTP en erreur', async () => {
    const down: FetchLike = async () => ({ ok: false, text: async () => WITH_LINK });
    expect(await checkReciprocal(down)).toBe('unreachable');
  });

  it('interroge l’adresse du portfolio, une seule fois', async () => {
    const spy = vi.fn(pageOf(WITH_LINK));
    await checkReciprocal(spy);
    expect(spy).toHaveBeenCalledExactlyOnceWith('https://paulperigault.fr');
  });
});

describe('contrôles JSON-LD', () => {
  it('findNodes trouve les nœuds imbriqués', () => {
    expect(findNodes({ '@graph': [personLd(), websiteLd()] }, 'Person')).toHaveLength(2);
    expect(findNodes('texte', 'Person')).toEqual([]);
  });

  it('personProblems : conforme puis écarts', () => {
    expect(personProblems(personLd())).toEqual([]);
    const bad = { ...personLd(), '@id': 'x', sameAs: [] };
    expect(personProblems(bad)).toHaveLength(3);
  });

  it('websiteProblems : conforme puis écarts', () => {
    expect(websiteProblems(websiteLd())).toEqual([]);
    expect(websiteProblems({ ...websiteLd(), url: 'x', author: {} })).toHaveLength(2);
  });

  it('liens croisés : @id stables, WebSite.url vers le site design', () => {
    expect(personLd()['@id']).toBe('https://paulperigault.fr/#person');
    expect(websiteLd()).toMatchObject({
      '@id': 'https://design.paulperigault.dev/#website',
      url: 'https://design.paulperigault.dev/',
      author: { '@id': 'https://paulperigault.fr/#person' },
    });
  });

  it('Person : pas de `owns` (attend OwnershipInfo ou Product, pas un WebSite)', () => {
    expect(Object.keys(personLd()).sort()).toEqual([
      '@id',
      '@type',
      'jobTitle',
      'name',
      'sameAs',
      'url',
    ]);
  });
});
