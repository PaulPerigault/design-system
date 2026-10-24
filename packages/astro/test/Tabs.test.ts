import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Tabs from '../src/navigation/Tabs.astro';

const TABS = [
  { id: 'a', label: 'Premier' },
  { id: 'b', label: 'Second' },
];

const render = async (props: Record<string, unknown> = {}): Promise<Document> => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Tabs, {
    props: { label: 'Exemple', tabs: TABS, ...props },
    slots: { a: '<p>Contenu A</p>', b: '<p>Contenu B</p>' },
  });
  return parseHTML(`<!doctype html><html><body>${html}</body></html>`).document;
};

describe('Tabs (rendu serveur)', () => {
  it('rend une liste nommée de liens d’ancre, sans rôle d’onglet', async () => {
    const document = await render();
    const list = document.querySelector('ul');
    expect(list?.getAttribute('aria-label')).toBe('Exemple');
    expect(list?.getAttribute('role')).toBe('list');
    const links = Array.from(document.querySelectorAll('li a'));
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['#a', '#b']);
    expect(links.map((link) => link.textContent?.trim())).toEqual(['Premier', 'Second']);
    expect(document.querySelectorAll('[role="tab"], [role="tabpanel"]')).toHaveLength(0);
  });

  it('rend chaque panneau lisible : section titrée avec son slot', async () => {
    const document = await render();
    const sections = Array.from(document.querySelectorAll('section'));
    expect(sections.map((section) => section.id)).toEqual(['a', 'b']);
    expect(sections[1]?.getAttribute('aria-labelledby')).toBe('b-title');
    expect(document.getElementById('b-title')?.textContent?.trim()).toBe('Second');
    expect(sections[0]?.textContent).toContain('Contenu A');
    expect(document.querySelectorAll('[hidden]')).toHaveLength(0);
  });

  it('relie chaque lien à un identifiant propre', async () => {
    const document = await render();
    expect(document.querySelector('a[href="#a"]')?.id).toBe('a-tab');
  });

  it('data-selected : premier par défaut, selected valide, inconnu retombe sur le premier', async () => {
    const selected = async (props = {}) =>
      (await render(props)).querySelector('[data-pp-tabs]')?.getAttribute('data-selected');
    expect(await selected()).toBe('a');
    expect(await selected({ selected: 'b' })).toBe('b');
    expect(await selected({ selected: 'zzz' })).toBe('a');
  });

  it('transmet `class` à côté de pp-tabs', async () => {
    const root = (await render({ class: 'placement' })).querySelector('.pp-tabs');
    expect(root?.classList.contains('placement')).toBe(true);
  });

  it('refuse moins de deux onglets', async () => {
    await expect(render({ tabs: [TABS[0]] })).rejects.toThrow(/deux onglets/);
  });

  it('ne pose aucun attribut style', async () => {
    expect((await render()).querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Tabs (source)', () => {
  const source = readFileSync(new URL('../src/navigation/Tabs.astro', import.meta.url), 'utf8');

  it('charge le behavior par un script du composant', () => {
    expect(source).toMatch(/<script>[\s\S]*from '\.\.\/behaviors\/tabs'/);
  });

  it('distingue l’onglet actif par un trait et une graisse', () => {
    expect(source).toMatch(/aria-selected='true'\][^}]*border-block-end-color/);
    expect(source).toMatch(/font-weight: var\(--pp-font-weight-bold\)/);
  });
});
