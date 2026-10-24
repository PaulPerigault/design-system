import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Timeline from '../src/content/Timeline.astro';
import { renderDom } from './render';

const ITEMS = [
  { time: '2024', datetime: '2024-01', title: 'Lancement', description: 'Première version.' },
  { time: '2025', title: 'Refonte' },
];

const render = async (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Timeline, { props: { items: ITEMS, ...props } });

const list = async (props: Record<string, unknown> = {}): Promise<Element> => {
  const element = (await render(props)).querySelector('.pp-timeline');
  if (!element) throw new Error('racine .pp-timeline absente');
  return element;
};

const entries = async (props: Record<string, unknown> = {}): Promise<Element[]> =>
  Array.from((await list(props)).querySelectorAll(':scope > li'));

describe('Timeline (rendu)', () => {
  it('rend une liste ordonnée avec role="list"', async () => {
    const element = await list();
    expect(element.tagName.toLowerCase()).toBe('ol');
    expect(element.getAttribute('role')).toBe('list');
  });

  it('rend une entrée par item, dans l’ordre fourni', async () => {
    const titles = (await entries()).map((entry) => entry.querySelector('strong')?.textContent);
    expect(titles).toEqual(['Lancement', 'Refonte']);
  });

  it('rend une liste vide sans entrée', async () => {
    expect(await entries({ items: [] })).toHaveLength(0);
  });

  it('écrit la date dans time, avec datetime seulement quand il est donné', async () => {
    const [first, second] = await entries();
    if (!first || !second) throw new Error('deux entrées attendues');
    expect(first.querySelector('time')?.getAttribute('datetime')).toBe('2024-01');
    expect(second.querySelector('time')?.textContent).toBe('2025');
    expect(second.querySelector('time')?.hasAttribute('datetime')).toBe(false);
  });

  it('rend le titre en strong', async () => {
    const [first] = await entries();
    if (!first) throw new Error('entrée attendue');
    expect(first.querySelector('strong')?.textContent).toBe('Lancement');
  });

  it('rend la description en p seulement quand elle est donnée', async () => {
    const [first, second] = await entries();
    if (!first || !second) throw new Error('deux entrées attendues');
    expect(first.querySelector('p')?.textContent).toBe('Première version.');
    expect(second.querySelector('p')).toBeNull();
  });

  it('nomme la liste avec label, sans aria-label par défaut', async () => {
    expect((await list()).hasAttribute('aria-label')).toBe(false);
    expect((await list({ label: 'Historique' })).getAttribute('aria-label')).toBe('Historique');
  });

  it('pose data-order seulement quand order est donné', async () => {
    expect((await list()).hasAttribute('data-order')).toBe(false);
    expect((await list({ order: 'desc' })).getAttribute('data-order')).toBe('desc');
  });

  it('transmet class à côté de pp-timeline', async () => {
    const element = await list({ class: 'placement' });
    expect(element.classList.contains('pp-timeline')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose que le rôle list', async () => {
    const document = await render();
    const roles = Array.from(document.querySelectorAll('[role]')).map((node) =>
      node.getAttribute('role'),
    );
    expect(roles).toEqual(['list']);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await render({ order: 'asc', label: 'Historique' });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Timeline (source CSS)', () => {
  const source = readFileSync(new URL('../src/content/Timeline.astro', import.meta.url), 'utf8');

  it('remet la liste sans puces', () => {
    expect(source).toMatch(/\.pp-timeline\s*\{[^}]*list-style:\s*none/);
  });

  it('n’utilise ni dégradé, ni ombre, ni flou', () => {
    expect(source).not.toMatch(/gradient|box-shadow|backdrop-filter|filter:/);
  });
});
