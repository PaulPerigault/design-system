import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Breadcrumb from '../src/content/Breadcrumb.astro';
import { renderDom } from './render';

const ITEMS = [
  { href: '/', label: 'Accueil' },
  { href: '/composants', label: 'Composants' },
  { label: 'Fil d’Ariane' },
];

const render = (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Breadcrumb, { props: { label: 'Chemin', items: ITEMS, ...props } });

describe('Breadcrumb (rendu)', () => {
  it('rend un repère nav nommé par `label`', async () => {
    const nav = (await render()).querySelector('nav');
    expect(nav?.getAttribute('aria-label')).toBe('Chemin');
  });

  it('rend une liste ordonnée avec role="list" et un li par élément', async () => {
    const list = (await render()).querySelector('nav > ol');
    expect(list?.getAttribute('role')).toBe('list');
    expect(list?.querySelectorAll(':scope > li')).toHaveLength(ITEMS.length);
  });

  it('rend les éléments avec href comme liens nommés', async () => {
    const links = [...(await render()).querySelectorAll('a')];
    expect(links.map((a) => a.textContent)).toEqual(['Accueil', 'Composants']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/', '/composants']);
  });

  it('marque le dernier élément aria-current="page", sans lien', async () => {
    const document = await render();
    const current = document.querySelectorAll('[aria-current]');
    expect(current).toHaveLength(1);
    expect(current[0]?.getAttribute('aria-current')).toBe('page');
    expect(current[0]?.textContent).toBe('Fil d’Ariane');
    expect(current[0]?.closest('a')).toBeNull();
  });

  it('n’emploie pas de lien pour le dernier élément même avec href', async () => {
    const items = [
      { href: '/', label: 'Accueil' },
      { href: '/ici', label: 'Ici' },
    ];
    const document = await render({ items });
    expect(document.querySelectorAll('a')).toHaveLength(1);
    expect(document.querySelector('[aria-current="page"]')?.textContent).toBe('Ici');
  });

  it('rend un élément intermédiaire sans href en texte simple', async () => {
    const items = [{ label: 'Section' }, { label: 'Page' }];
    const document = await render({ items });
    expect(document.querySelectorAll('a')).toHaveLength(0);
    expect(document.querySelectorAll('li')).toHaveLength(2);
  });

  it('ne met aucun séparateur dans le texte lu', async () => {
    const text = (await render()).querySelector('ol')?.textContent ?? '';
    expect(text).not.toContain('/');
    expect(text).not.toContain('›');
  });

  it('transmet `class` à côté de pp-breadcrumb', async () => {
    const nav = (await render({ class: 'placement' })).querySelector('nav');
    expect(nav?.classList.contains('pp-breadcrumb')).toBe(true);
    expect(nav?.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    expect((await render()).querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Breadcrumb (source CSS)', () => {
  const source = readFileSync(new URL('../src/content/Breadcrumb.astro', import.meta.url), 'utf8');

  it('génère le séparateur en CSS avec texte alternatif vide', () => {
    expect(source).toContain("content: '/' / ''");
  });

  it('souligne les liens (information non portée par la couleur seule)', () => {
    expect(source).toMatch(/\.pp-breadcrumb a\s*\{[^}]*text-decoration:\s*underline/);
  });

  it('retire le style de liste sans propriété physique', () => {
    expect(source).toContain('list-style: none');
    expect(source).not.toMatch(/\b(?:margin|padding):\s*0/);
  });
});
