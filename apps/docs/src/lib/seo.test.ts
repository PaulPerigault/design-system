import { describe, expect, it } from 'vitest';
import {
  breadcrumbLd,
  canonicalOf,
  graph,
  ogImageOf,
  personLd,
  serialize,
  softwareLd,
  techArticleLd,
  titleOf,
  websiteLd,
} from './seo.ts';
import type { JsonLd } from './seo.ts';

const ABSOLUTE = /^https:\/\//;

/** Toutes les valeurs d'un objet JSON, récursivement. */
function values(node: unknown): unknown[] {
  if (node === null || typeof node !== 'object') return [node];
  return Object.values(node).flatMap(values);
}

describe('titleOf', () => {
  it('garde le format historique', () => {
    expect(titleOf('Glossaire')).toBe('Glossaire · Design system · Paul Perigault');
  });
});

describe('canonicalOf', () => {
  it.each([
    ['/', 'https://design.paulperigault.dev/'],
    ['/identite', 'https://design.paulperigault.dev/identite/'],
    ['/components/stack/?a=1#x', 'https://design.paulperigault.dev/components/stack/'],
    ['glossaire/', 'https://design.paulperigault.dev/glossaire/'],
  ])('%s', (input, expected) => {
    expect(canonicalOf(input)).toBe(expected);
  });
});

describe('ogImageOf', () => {
  it('nomme l’image d’après le dernier segment', () => {
    expect(ogImageOf('/')).toBe('https://design.paulperigault.dev/og/index.png');
    expect(ogImageOf('/components/stack/')).toBe('https://design.paulperigault.dev/og/stack.png');
  });
});

describe('JSON-LD', () => {
  it('Person : champs obligatoires et sameAs', () => {
    const person = personLd();
    expect(person).toMatchObject({
      '@type': 'Person',
      name: 'Paul Perigault',
      url: 'https://paulperigault.fr',
      jobTitle: 'DevOps / DevSecOps',
      sameAs: ['https://paulperigault.fr', 'https://github.com/PaulPerigault'],
    });
  });

  it('WebSite : auteur et langue', () => {
    expect(websiteLd()).toMatchObject({ '@type': 'WebSite', inLanguage: 'fr', author: personLd() });
  });

  it('SoftwareSourceCode : dépôt, licence MIT, langage', () => {
    expect(softwareLd()).toMatchObject({
      '@type': 'SoftwareSourceCode',
      codeRepository: 'https://github.com/PaulPerigault/design-system',
      license: 'https://opensource.org/licenses/MIT',
      programmingLanguage: 'TypeScript',
    });
  });

  it('TechArticle : titre, description, url, auteur', () => {
    const url = canonicalOf('/components/stack/');
    const article = techArticleLd({ title: 'Stack', description: 'Pile verticale.', url });
    expect(article).toMatchObject({ '@type': 'TechArticle', headline: 'Stack', url });
    expect(article.author).toEqual(personLd());
    expect(article.inLanguage).toBe('fr');
  });

  it('BreadcrumbList : positions consécutives, item absolu', () => {
    const list = breadcrumbLd([
      { name: 'Accueil', path: '/' },
      { name: 'Composants', path: '/composants/' },
      { name: 'Stack', path: 'https://design.paulperigault.dev/components/stack/' },
    ]);
    const items = list.itemListElement as { position: number; name: string; item: string }[];
    expect(items.map((entry) => entry.position)).toEqual([1, 2, 3]);
    for (const entry of items) expect(entry.item).toMatch(ABSOLUTE);
    expect(items[1]?.item).toBe('https://design.paulperigault.dev/composants/');
  });

  it('aucun undefined ni URL relative dans les constructeurs', () => {
    const nodes: JsonLd[] = [personLd(), websiteLd(), softwareLd()];
    for (const value of nodes.flatMap(values)) expect(value).not.toBeUndefined();
    expect(JSON.stringify(nodes)).not.toContain('undefined');
  });
});

describe('graph et serialize', () => {
  it('pose @context une seule fois', () => {
    const data = graph(personLd(), websiteLd());
    expect(data['@context']).toBe('https://schema.org');
    expect((data['@graph'] as JsonLd[]).length).toBe(2);
    expect(JSON.stringify(data).match(/@context/g)).toHaveLength(1);
  });

  it('échappe < pour rester inerte dans un script', () => {
    const out = serialize({ name: '</script><b>' });
    expect(out).not.toContain('<');
    expect(JSON.parse(out)).toEqual({ name: '</script><b>' });
  });
});
