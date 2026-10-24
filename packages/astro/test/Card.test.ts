import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Card from '../src/content/Card.astro';
import { renderDom } from './render';

const render = async (props: Record<string, unknown> = {}, slot = ''): Promise<Document> =>
  renderDom(Card, { props: { title: 'Titre', ...props }, slot });

const root = async (props: Record<string, unknown> = {}, slot = ''): Promise<Element> => {
  const element = (await render(props, slot)).querySelector('.pp-card');
  if (!element) throw new Error('racine .pp-card absente');
  return element;
};

describe('Card (rendu)', () => {
  it('rend un article avec un titre de niveau 3 par défaut, sans lien', async () => {
    const element = await root();
    expect(element.tagName.toLowerCase()).toBe('article');
    expect(element.querySelector('h3')?.textContent?.trim()).toBe('Titre');
    expect(element.querySelector('a')).toBeNull();
    expect(element.hasAttribute('data-linked')).toBe(false);
  });

  it.each([2, 3, 4])('rend un h%i pour headingLevel', async (level) => {
    const element = await root({ headingLevel: level });
    expect(element.querySelector(`h${level}`)).not.toBeNull();
    expect(element.querySelectorAll('h2, h3, h4')).toHaveLength(1);
  });

  it('retombe sur h3 pour un niveau hors plage', async () => {
    const element = await root({ headingLevel: 6 });
    expect(element.querySelector('h3')).not.toBeNull();
  });

  it('pose un seul lien nommé par le titre quand href est donné', async () => {
    const element = await root({ href: '/projets/a' });
    const links = element.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute('href')).toBe('/projets/a');
    expect(links[0]?.textContent?.trim()).toBe('Titre');
    expect(links[0]?.closest('h3')).not.toBeNull();
    expect(element.getAttribute('data-linked')).toBe('true');
  });

  it('rend le slot par défaut dans le corps', async () => {
    const element = await root({}, '<p>Texte</p>');
    expect(element.querySelector('.pp-card__body p')?.textContent).toBe('Texte');
  });

  it('omet média et pied de carte sans slot', async () => {
    const element = await root();
    expect(element.querySelector('.pp-card__media')).toBeNull();
    expect(element.querySelector('.pp-card__footer')).toBeNull();
  });

  it('transmet `class` à côté de pp-card', async () => {
    const element = await root({ class: 'placement' });
    expect(element.classList.contains('pp-card')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose ni rôle ni attribut style', async () => {
    const document = await render({ href: '/a', headingLevel: 2 }, '<p>Texte</p>');
    expect(document.querySelectorAll('[style], [role]')).toHaveLength(0);
  });
});

describe('Card (source CSS)', () => {
  const source = readFileSync(new URL('../src/content/card.css', import.meta.url), 'utf8');

  it('étend le lien sur la racine positionnée', () => {
    expect(source).toMatch(/\.pp-card\s*\{[^}]*position: relative/);
    expect(source).toMatch(/\.pp-card__link::after\s*\{[^}]*position: absolute;[^}]*inset: 0/);
  });

  it('place le pied de carte au-dessus du lien étendu', () => {
    expect(source).toMatch(
      /\.pp-card__footer\s*\{[^}]*position: relative;[^}]*z-index: var\(--pp-z/,
    );
  });

  it('montre le focus sur la carte entière, par jeton', () => {
    expect(source).toMatch(/\.pp-card__link:focus-visible::after\s*\{[^}]*var\(--pp-color-focus\)/);
  });

  it('vise le contenu des slots par un CSS global et n’emploie ni ombre ni flou', () => {
    const component = readFileSync(new URL('../src/content/Card.astro', import.meta.url), 'utf8');
    expect(component).toContain("import './card.css'");
    expect(source).toMatch(/\.pp-card__body > \*/);
    expect(source).not.toMatch(/box-shadow|backdrop-filter|gradient/);
  });
});
