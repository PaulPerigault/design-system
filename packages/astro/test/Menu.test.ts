import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Menu from '../src/navigation/Menu.astro';
import { renderDom } from './render';

const ITEMS = [
  { label: 'Copier', action: 'copy' },
  { label: 'Ouvrir', href: '/ouvrir' },
  { label: 'Supprimer', action: 'delete', disabled: true },
];

const render = async (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Menu, { props: { label: 'Actions', id: 'actions', items: ITEMS, ...props } });

const panelOf = async (props: Record<string, unknown> = {}): Promise<Element> => {
  const panel = (await render(props)).querySelector('[role="menu"]');
  if (!panel) throw new Error('panneau absent');
  return panel;
};

describe('Menu (rendu)', () => {
  it('rend un bouton de menu relié au panneau', async () => {
    const button = (await render()).querySelector('button.pp-menu__button');
    expect(button?.getAttribute('aria-haspopup')).toBe('menu');
    expect(button?.getAttribute('aria-expanded')).toBe('false');
    expect(button?.getAttribute('aria-controls')).toBe('actions');
    expect(button?.getAttribute('popovertarget')).toBe('actions');
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.textContent?.trim()).toBe('Actions');
  });

  it('rend un panneau popover="auto" nommé par le bouton', async () => {
    const panel = await panelOf();
    expect(panel.id).toBe('actions');
    expect(panel.getAttribute('popover')).toBe('auto');
    expect(panel.getAttribute('aria-labelledby')).toBe('actions-button');
  });

  it('rend une entrée menuitem par élément : lien si href, sinon bouton data-action', async () => {
    const entries = [...(await panelOf()).querySelectorAll('[role="menuitem"]')];
    expect(entries.map((entry) => entry.tagName.toLowerCase())).toEqual(['button', 'a', 'button']);
    expect(entries.map((entry) => entry.textContent?.trim())).toEqual(ITEMS.map((i) => i.label));
    expect(entries[0]?.getAttribute('data-action')).toBe('copy');
    expect(entries[1]?.getAttribute('href')).toBe('/ouvrir');
    expect(entries.every((entry) => entry.getAttribute('tabindex') === '-1')).toBe(true);
  });

  it('garde focalisable une entrée désactivée, avec aria-disabled', async () => {
    const entries = [...(await panelOf()).querySelectorAll('[role="menuitem"]')];
    expect(entries[2]?.getAttribute('aria-disabled')).toBe('true');
    expect(entries[2]?.hasAttribute('disabled')).toBe(false);
    expect(entries[0]?.hasAttribute('aria-disabled')).toBe(false);
  });

  it('lien désactivé : aria-disabled sur le lien', async () => {
    const items = [{ label: 'Voir', href: '/voir', disabled: true }];
    const entry = (await panelOf({ items })).querySelector('a');
    expect(entry?.getAttribute('aria-disabled')).toBe('true');
  });

  it('liste vide : bouton et panneau sans entrée', async () => {
    const panel = await panelOf({ items: [] });
    expect(panel.querySelectorAll('[role="menuitem"]')).toHaveLength(0);
  });

  it('id différent : aria-controls et id du bouton suivent', async () => {
    const document = await render({ id: 'autre' });
    expect(document.querySelector('button')?.getAttribute('aria-controls')).toBe('autre');
    expect(document.querySelector('button')?.id).toBe('autre-button');
  });

  it('transmet `class` à côté de pp-menu', async () => {
    const root = (await render({ class: 'placement' })).querySelector('.pp-menu');
    expect(root?.classList.contains('placement')).toBe(true);
  });

  it('masque l’icône et ne pose aucun attribut style', async () => {
    const document = await render();
    expect(document.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Menu (source)', () => {
  const css = readFileSync(new URL('../src/navigation/menu.css', import.meta.url), 'utf8');
  const source = readFileSync(new URL('../src/navigation/Menu.astro', import.meta.url), 'utf8');

  it('importe sa feuille globale et son comportement', () => {
    expect(source).toContain("import './menu.css'");
    expect(source).toContain("from '../behaviors/menu'");
  });

  it('dimensionne les cibles par jeton, ancre le panneau, sans ombre ni flou', () => {
    expect(css).toMatch(/min-block-size: var\(--pp-size-target-min\)/);
    expect(css).toMatch(/position-area: block-end/);
    expect(css).not.toMatch(/box-shadow|backdrop-filter|gradient/);
  });
});
