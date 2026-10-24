import { describe, expect, it } from 'vitest';
import Pagination from '../src/navigation/Pagination.astro';
import { pageWindow } from '../src/navigation/pagination';
import { renderDom } from './render';

// Chaque entrée : « total courant [around] » → pages affichées, « … » pour une ellipsis.
const CASES: Record<string, string> = {
  '5 3': '1 2 3 4 5',
  '20 10': '1 … 9 10 11 … 20',
  '20 1': '1 2 … 20',
  '20 20': '1 … 19 20',
  '10 3': '1 2 3 4 … 10',
  '7 4': '1 2 3 4 5 6 7',
  '1 1': '1',
  '20 99': '1 … 19 20',
  '20 -4': '1 2 … 20',
  '30 15 2': '1 … 13 14 15 16 17 … 30',
  '30 15 0': '1 … 15 … 30',
  '30 15 -3': '1 … 15 … 30',
};

const show = (pages: (number | null)[]): string => pages.map((p) => p ?? '…').join(' ');

// Pagination.test.ts et pagination.test.ts désignent le même fichier sur un disque insensible à la
// casse (macOS) : les deux suites vivent donc ici.
describe('pageWindow', () => {
  it.each(Object.entries(CASES))('pageWindow(%s)', (args, expected) => {
    const [total = 0, current = 0, around] = args.split(' ').map(Number);
    expect(show(pageWindow(total, current, around))).toBe(expected);
  });

  it.each([0, -2, 2.5, Number.NaN])('renvoie [] pour le total %s', (total) => {
    expect(pageWindow(total, 1)).toEqual([]);
  });
});

const ITEMS = [
  { label: '1', href: '/p/1' },
  { label: '2', href: '/p/2', current: true },
  { label: '3', href: '/p/3' },
];

const render = async (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Pagination, { props: { label: 'Pagination', items: ITEMS, ...props } });

describe('Pagination (rendu)', () => {
  it('rend un repère nav nommé avec une liste explicite', async () => {
    const document = await render({ label: 'Résultats' });
    expect(document.querySelector('nav')?.getAttribute('aria-label')).toBe('Résultats');
    expect(document.querySelector('nav > ul')?.getAttribute('role')).toBe('list');
    expect(document.querySelectorAll('li')).toHaveLength(ITEMS.length);
  });

  it('rend la page courante en span aria-current, sans lien', async () => {
    const current = (await render()).querySelectorAll('[aria-current]');
    expect(current).toHaveLength(1);
    expect(current[0]?.tagName.toLowerCase()).toBe('span');
    expect(current[0]?.getAttribute('aria-current')).toBe('page');
    expect(current[0]?.textContent).toBe('2');
  });

  it('rend les autres pages en liens avec leur href', async () => {
    const links = [...(await render()).querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/p/1', '/p/3']);
    expect(links.map((a) => a.textContent?.trim())).toEqual(['1', '3']);
  });

  it('n’a ni précédent ni suivant par défaut', async () => {
    const document = await render();
    expect(document.querySelector('[data-kind="previous"]')).toBeNull();
    expect(document.querySelector('[data-kind="next"]')).toBeNull();
  });

  it('place précédent avant et suivant après les pages', async () => {
    const document = await render({
      previous: { label: 'Page précédente', href: '/p/1' },
      next: { label: 'Page suivante', href: '/p/3' },
    });
    const kinds = [...document.querySelectorAll('li')].map((li) => li.getAttribute('data-kind'));
    expect(kinds).toEqual(['previous', 'page', 'page', 'page', 'next']);
    expect(document.querySelector('a[rel="prev"]')?.textContent?.trim()).toBe('Page précédente');
    expect(document.querySelector('a[rel="next"]')?.getAttribute('href')).toBe('/p/3');
  });

  it('accepte seulement suivant', async () => {
    const document = await render({ next: { label: 'Suivant', href: '/p/3' } });
    expect(document.querySelector('[data-kind="previous"]')).toBeNull();
    expect(document.querySelectorAll('a[rel="next"]')).toHaveLength(1);
  });

  it('accepte une liste vide et une page unique courante', async () => {
    expect((await render({ items: [] })).querySelectorAll('li')).toHaveLength(0);
    const single = await render({ items: [{ label: '1', href: '/p/1', current: true }] });
    expect(single.querySelectorAll('a')).toHaveLength(0);
    expect(single.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it('transmet `class` et ne pose aucun attribut style', async () => {
    const document = await render({ class: 'placement', previous: { label: 'P', href: '/p/1' } });
    const nav = document.querySelector('nav');
    expect(nav?.classList.contains('pp-pagination')).toBe(true);
    expect(nav?.classList.contains('placement')).toBe(true);
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});
