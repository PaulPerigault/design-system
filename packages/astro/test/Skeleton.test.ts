import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Skeleton from '../src/feedback/Skeleton.astro';
import { renderDom } from './render';

const LABEL = 'Chargement du contenu';

const render = async (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Skeleton, { props: { label: LABEL, ...props } });

const root = async (props: Record<string, unknown> = {}): Promise<Element> => {
  const element = (await render(props)).querySelector('.pp-skeleton');
  if (!element) throw new Error('racine .pp-skeleton absente');
  return element;
};

const lineCount = async (props: Record<string, unknown> = {}): Promise<number> =>
  (await root(props)).querySelectorAll('.pp-skeleton__line').length;

describe('Skeleton (rendu)', () => {
  it('rend une racine role="status" occupée', async () => {
    const element = await root();
    expect(element.getAttribute('role')).toBe('status');
    expect(element.getAttribute('aria-busy')).toBe('true');
  });

  it('porte le libellé dans un span masqué visuellement', async () => {
    const hidden = (await root()).querySelector('.pp-skeleton__label');
    expect(hidden?.tagName.toLowerCase()).toBe('span');
    expect(hidden?.textContent?.trim()).toBe(LABEL);
  });

  it('nomme la zone par son contenu, sans aria-label ni aria-labelledby', async () => {
    const element = await root();
    expect(element.hasAttribute('aria-label')).toBe(false);
    expect(element.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('affiche trois lignes par défaut', async () => {
    expect(await lineCount()).toBe(3);
  });

  it('masque chaque ligne aux lecteurs d’écran', async () => {
    const lines = (await root({ lines: 4 })).querySelectorAll('.pp-skeleton__line');
    expect(lines.length).toBe(4);
    lines.forEach((line) => expect(line.getAttribute('aria-hidden')).toBe('true'));
  });

  it('ne pose aucun attribut style', async () => {
    const document = await render({ lines: 5 });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Skeleton (prop lines)', () => {
  it.each([
    [1, 1],
    [6, 6],
  ])('lines=%i rend %i ligne(s)', async (lines, expected) => {
    expect(await lineCount({ lines })).toBe(expected);
  });

  it('ramène une valeur sous 1 à 1 ligne', async () => {
    expect(await lineCount({ lines: 0 })).toBe(1);
  });

  it('ramène une valeur au-dessus de 6 à 6 lignes', async () => {
    expect(await lineCount({ lines: 9 })).toBe(6);
  });

  it('tronque une valeur non entière', async () => {
    expect(await lineCount({ lines: 2.7 })).toBe(2);
  });
});

describe('Skeleton (prop label)', () => {
  it('lit le libellé fourni, sans texte en dur', async () => {
    const hidden = (await root({ label: 'Chargement des résultats' })).querySelector(
      '.pp-skeleton__label',
    );
    expect(hidden?.textContent?.trim()).toBe('Chargement des résultats');
  });
});

describe('Skeleton (source CSS)', () => {
  const source = readFileSync(new URL('../src/feedback/Skeleton.astro', import.meta.url), 'utf8');
  const style = source.slice(source.indexOf('<style>'));

  it('n’utilise aucune couleur, taille ou durée brute', () => {
    expect(style).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(style).not.toMatch(/\b(rgb|hsl|oklch)\(/);
    expect(style).not.toMatch(/\b\d+(\.\d+)?(px|rem|em|ms|s)\b/);
  });

  it('n’utilise ni dégradé, ni ombre, ni flou', () => {
    expect(style).not.toMatch(/gradient|box-shadow|text-shadow|filter|backdrop/);
  });

  it('anime l’opacité et seulement elle', () => {
    expect(style).toMatch(/@keyframes pp-skeleton-fade\s*\{[^}]*\{\s*opacity: 1;/);
    expect(style).toMatch(/to\s*\{\s*opacity: 0\.5;/);
  });

  it('supprime l’animation sous prefers-reduced-motion', () => {
    expect(style).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.pp-skeleton__line\s*\{\s*animation: none;/,
    );
  });

  it('dessine une bordure CanvasText en forced-colors', () => {
    expect(style).toMatch(
      /@media \(forced-colors: active\)[\s\S]*border: var\(--pp-size-rule\) solid CanvasText;/,
    );
  });
});
