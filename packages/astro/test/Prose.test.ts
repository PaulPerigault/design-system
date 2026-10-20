import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Prose from '../src/content/Prose.astro';
import { renderDom } from './render';

const render = (slot = ''): Promise<Document> => renderDom(Prose, { slot });

describe('Prose (rendu)', () => {
  it('rend un conteneur .pp-prose', async () => {
    const prose = (await render()).querySelector('.pp-prose');
    expect(prose?.tagName.toLowerCase()).toBe('div');
  });

  it('transmet le contenu du slot', async () => {
    const slot = '<p>Contenu</p>';
    const prose = (await render(slot)).querySelector('.pp-prose');
    expect(prose?.querySelector('p')?.textContent).toBe('Contenu');
  });

  it('transmet `class` à côté de pp-prose', async () => {
    const prose = (await render()).querySelector('.pp-prose');
    expect(prose?.classList.contains('pp-prose')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await render('<h1>Titre</h1><p>Texte</p>');
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });

  it('rend un h1, h2, h3 avec le slot', async () => {
    const document = await render('<h1>H1</h1><h2>H2</h2><h3>H3</h3>');
    expect(document.querySelector('.pp-prose > h1')?.textContent).toBe('H1');
    expect(document.querySelector('.pp-prose > h2')?.textContent).toBe('H2');
    expect(document.querySelector('.pp-prose > h3')?.textContent).toBe('H3');
  });

  it('rend une liste avec le slot', async () => {
    const document = await render('<ul><li>Item 1</li><li>Item 2</li></ul>');
    expect(document.querySelectorAll('.pp-prose > ul > li')).toHaveLength(2);
  });

  it('rend un lien avec le slot', async () => {
    const document = await render('<a href="/">Accueil</a>');
    expect(document.querySelector('.pp-prose > a')?.getAttribute('href')).toBe('/');
    expect(document.querySelector('.pp-prose > a')?.textContent).toBe('Accueil');
  });

  it('rend un tableau avec le slot', async () => {
    const slot =
      '<table><thead><tr><th>Col 1</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>';
    const document = await render(slot);
    expect(document.querySelector('.pp-prose > table')).toBeTruthy();
    expect(document.querySelector('.pp-prose > table th')?.textContent).toBe('Col 1');
  });

  it('rend un blockquote avec le slot', async () => {
    const document = await render('<blockquote>Citation</blockquote>');
    expect(document.querySelector('.pp-prose > blockquote')?.textContent).toBe('Citation');
  });

  it('rend du code inline et un bloc code avec le slot', async () => {
    const document = await render('<p><code>inline</code></p><pre><code>bloc</code></pre>');
    expect(document.querySelector('p > code')?.textContent).toBe('inline');
    expect(document.querySelector('pre > code')?.textContent).toBe('bloc');
  });
});

describe('Prose (source CSS)', () => {
  const source = readFileSync(new URL('../src/content/Prose.astro', import.meta.url), 'utf8');

  it('utilise max-inline-size avec --pp-size-measure', () => {
    expect(source).toContain('max-inline-size: var(--pp-size-measure)');
  });

  it('style les titres h1 à h6 avec tokens', () => {
    expect(source).toContain('var(--pp-font-size-4)');
    expect(source).toContain('var(--pp-font-size-3)');
    expect(source).toContain('var(--pp-font-size-2)');
    expect(source).toContain('var(--pp-font-weight-bold)');
  });

  it('utilise :global() pour le slot', () => {
    expect(source).toMatch(/:global\(/);
  });

  it('style les liens avec --pp-color-accent', () => {
    expect(source).toContain('color: var(--pp-color-accent)');
  });

  it('style les blockquotes avec accent et spacing', () => {
    expect(source).toContain('border-inline-start: var(--pp-size-focus-width)');
    expect(source).toContain('var(--pp-space-m)');
  });

  it('style les tables avec des lignes et monospace des code', () => {
    expect(source).toContain('border-collapse: collapse');
    expect(source).toContain('var(--pp-font-family-mono)');
  });

  it('utilise uniquement les tokens --pp-*', () => {
    // Vérifier l'absence de nombres bruts (sauf les points et les zéros de coefficients)
    expect(source).not.toMatch(/:\s*(?:0\.?\d+|[1-9]\d*(?:\.\d+)?)(px|rem|em|%|ms|s)\b/);
  });
});
