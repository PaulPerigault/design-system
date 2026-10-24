import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import EmptyState from '../src/content/EmptyState.astro';
import { renderDom } from './render';

const BASE = { title: 'Aucun résultat' };

// `renderDom` ne transmet que le slot par défaut : le slot nommé `action` passe par la Container API.
const renderWithAction = async (
  action: string,
  props: Record<string, unknown> = BASE,
): Promise<Document> => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(EmptyState, {
    props,
    slots: { default: '<p>Essayez un autre filtre.</p>', action },
  });
  return parseHTML(`<!doctype html><html><body>${html}</body></html>`).document;
};

const root = async (props: Record<string, unknown> = {}, slot = ''): Promise<Element> => {
  const element = (
    await renderDom(EmptyState, { props: { ...BASE, ...props }, slot })
  ).querySelector('.pp-empty-state');
  if (!element) throw new Error('racine .pp-empty-state absente');
  return element;
};

describe('EmptyState (rendu)', () => {
  it('rend une section, nommée par son titre', async () => {
    const element = await root();
    expect(element.tagName.toLowerCase()).toBe('section');
    const heading = element.querySelector('h2');
    expect(heading?.textContent).toBe('Aucun résultat');
    expect(element.getAttribute('aria-labelledby')).toBe(heading?.id);
  });

  it('ne pose aucun rôle explicite', async () => {
    const document = await renderDom(EmptyState, { props: BASE });
    expect(document.querySelectorAll('[role]')).toHaveLength(0);
  });

  it.each([
    [2, 'h2'],
    [3, 'h3'],
    [4, 'h4'],
  ] as const)('headingLevel=%i rend un titre %s', async (headingLevel, tag) => {
    const element = await root({ headingLevel });
    expect(element.querySelector(tag)?.textContent).toBe('Aucun résultat');
    expect(element.querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(1);
  });

  it('retombe sur h2 pour un niveau hors liste', async () => {
    const element = await root({ headingLevel: 7 });
    expect(element.querySelector('h2')).not.toBeNull();
    expect(element.querySelector('h7')).toBeNull();
  });

  it('pose data-align="start" par défaut, et "center" sur demande', async () => {
    expect((await root()).getAttribute('data-align')).toBe('start');
    expect((await root({ align: 'center' })).getAttribute('data-align')).toBe('center');
  });

  it('dérive un identifiant sans accent ni espace du titre', async () => {
    const element = await root({ title: 'Aucun élément trouvé' });
    const heading = element.querySelector('h2');
    expect(heading?.id).toBe('pp-empty-state-aucun-element-trouve');
    expect(element.getAttribute('aria-labelledby')).toBe(heading?.id);
  });

  it('rend l’explication du slot par défaut dans le corps', async () => {
    const element = await root({}, '<p>Essayez un autre filtre.</p>');
    expect(element.querySelector('.pp-empty-state__body p')?.textContent).toBe(
      'Essayez un autre filtre.',
    );
  });

  it('rend le slot action quand il est fourni', async () => {
    const document = await renderWithAction('<a href="/nouveau">Créer</a>');
    const action = document.querySelector('.pp-empty-state__action a');
    expect(action?.textContent).toBe('Créer');
  });

  it('n’ajoute pas de zone action sans slot action', async () => {
    const element = await root({}, '<p>x</p>');
    expect(element.querySelector('.pp-empty-state__action')).toBeNull();
  });

  it('transmet `class` à côté de pp-empty-state', async () => {
    const element = await root({ class: 'placement' });
    expect(element.classList.contains('pp-empty-state')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await renderWithAction('<a href="/x">Créer</a>', {
      title: 'Vide',
      align: 'center',
    });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});
