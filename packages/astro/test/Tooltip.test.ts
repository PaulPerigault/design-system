import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Tooltip from '../src/overlay/Tooltip.astro';
import { renderDom } from './render';

const SLOT = '<button type="button">Copier</button>';

const render = async (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Tooltip, { props: { id: 'aide', text: 'Copie l’adresse.', ...props }, slot: SLOT });

const tip = async (props: Record<string, unknown> = {}): Promise<Element> => {
  const element = (await render(props)).querySelector('[role="tooltip"]');
  if (!element) throw new Error('infobulle absente');
  return element;
};

describe('Tooltip (rendu)', () => {
  it('rend un conteneur .pp-tooltip, le contrôle et une infobulle masquée', async () => {
    const document = await render();
    const root = document.querySelector('.pp-tooltip');
    expect(root?.querySelector('button')?.textContent).toBe('Copier');
    const element = root?.querySelector('[role="tooltip"]');
    expect(element?.hasAttribute('hidden')).toBe(true);
    expect(element?.parentElement).toBe(root);
  });

  it('pose id et texte, le texte donne la description accessible', async () => {
    const element = await tip({ id: 'x-1', text: 'Autre texte' });
    expect(element.getAttribute('id')).toBe('x-1');
    expect(element.textContent).toBe('Autre texte');
  });

  it('échappe le balisage du texte', async () => {
    const element = await tip({ text: '<b>gras</b>' });
    expect(element.querySelector('b')).toBeNull();
    expect(element.textContent).toBe('<b>gras</b>');
  });

  it('ne modifie pas le contrôle du slot (aria-describedby posé par le script)', async () => {
    const button = (await render()).querySelector('button');
    expect(button?.hasAttribute('aria-describedby')).toBe(false);
  });

  it('un seul rôle tooltip, aucun autre rôle', async () => {
    const document = await render();
    expect(document.querySelectorAll('[role]')).toHaveLength(1);
  });

  it('transmet `class` à côté de pp-tooltip', async () => {
    const root = (await render({ class: 'placement' })).querySelector('.pp-tooltip');
    expect(root?.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    expect((await render()).querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Tooltip (source)', () => {
  const source = readFileSync(new URL('../src/overlay/Tooltip.astro', import.meta.url), 'utf8');

  it('utilise des jetons et aucune ombre, flou ou dégradé', () => {
    expect(source).toMatch(/background: var\(--pp-color-surface\)/);
    expect(source).not.toMatch(/box-shadow|backdrop-filter|gradient/);
  });

  it('place l’infobulle avec des propriétés logiques', () => {
    expect(source).toMatch(/inset-block-start: 100%/);
    expect(source).not.toMatch(/(?<![-\w])(?:top|left|width|height):/);
  });
});
