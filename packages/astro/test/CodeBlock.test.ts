import { readFileSync } from 'node:fs';
import { contrastRatio } from '@paulperigault/tokens/contrast';
import tokens from '@paulperigault/tokens/tokens.json';
import { describe, expect, it } from 'vitest';
import CodeBlock from '../src/content/CodeBlock.astro';
import { renderDom } from './render';

const MIN_CONTRAST = 4.5; // WCAG 2.2, critère 1.4.3

const render = async (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(CodeBlock, {
    props: {
      code: 'const a = 1;',
      lang: 'ts',
      copyLabel: 'Copier',
      copiedLabel: 'Copié',
      ...props,
    },
  });

const pick = async (selector: string, props: Record<string, unknown> = {}): Promise<Element> => {
  const element = (await render(props)).querySelector(selector);
  if (!element) throw new Error(`${selector} absent`);
  return element;
};

describe('CodeBlock (rendu)', () => {
  it('rend une figure avec un pre focalisable et le code exact', async () => {
    const pre = await pick('figure.pp-code > pre');
    expect(pre.getAttribute('tabindex')).toBe('0');
    expect(pre.textContent).toBe('const a = 1;');
  });

  it('colore par data-tok, sans attribut style', async () => {
    const document = await render();
    expect(document.querySelector('.pp-tok[data-tok="keyword"]')?.textContent).toBe('const');
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });

  it('sans label ni filename : pre sans rôle ni nom, pas de légende', async () => {
    const document = await render();
    const pre = document.querySelector('pre');
    expect(pre?.hasAttribute('role')).toBe(false);
    expect(pre?.hasAttribute('aria-label')).toBe(false);
    expect(document.querySelector('figcaption')).toBeNull();
  });

  it('label : région nommée', async () => {
    const pre = await pick('pre', { label: 'Installation' });
    expect(pre.getAttribute('role')).toBe('region');
    expect(pre.getAttribute('aria-label')).toBe('Installation');
  });

  it('filename : légende, et nom du bloc à défaut de label', async () => {
    const document = await render({ filename: 'astro.config.ts' });
    expect(document.querySelector('figcaption')?.textContent).toBe('astro.config.ts');
    expect(document.querySelector('pre')?.getAttribute('aria-label')).toBe('astro.config.ts');
    const both = await pick('pre', { filename: 'a.ts', label: 'Config' });
    expect(both.getAttribute('aria-label')).toBe('Config');
  });

  it('lang inconnue : texte sans jeton, saut de ligne conservé', async () => {
    const document = await render({ code: 'a\nb\n', lang: 'klingon' });
    expect(document.querySelectorAll('.pp-tok')).toHaveLength(0);
    expect(document.querySelector('pre')?.textContent).toBe('a\nb');
  });

  it('sans lang : texte sans jeton', async () => {
    const document = await render({ lang: undefined });
    expect(document.querySelectorAll('.pp-tok')).toHaveLength(0);
  });

  it('bouton de copie masqué par défaut, libellés issus des props', async () => {
    const button = await pick('button[data-copy]', { copyLabel: 'Copy', copiedLabel: 'Copied' });
    expect(button.getAttribute('type')).toBe('button');
    expect(button.hasAttribute('hidden')).toBe(true);
    expect(button.textContent?.trim()).toBe('Copy');
    expect(button.getAttribute('data-copied')).toBe('Copied');
  });

  it('région de statut vide pour annoncer la copie', async () => {
    const status = await pick('[role="status"]');
    expect(status.textContent).toBe('');
  });

  it('échappe le HTML du code', async () => {
    const document = await render({ code: '<script>x</script>', lang: 'html' });
    expect(document.querySelector('pre script')).toBeNull();
    expect(document.querySelector('pre')?.textContent).toBe('<script>x</script>');
  });
});

describe('CodeBlock (source)', () => {
  const css = readFileSync(new URL('../src/content/code-block.css', import.meta.url), 'utf8');

  it('définit les variables Shiki à partir de jetons --pp-*', () => {
    const lines = css.split('\n').filter((line) => line.includes('--shiki-token-'));
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines.filter((l) => /^\s+--shiki-token-[a-z-]+:/.test(l))) {
      expect(line).toMatch(/var\(--pp-color-[a-z-]+\)/);
    }
  });

  it.each(['light', 'dark'] as const)('jetons de coloration >= 4,5:1 sur le fond (%s)', (theme) => {
    const colors = new Map(Object.entries(tokens.themes[theme]));
    const hex = (name: string): string => colors.get(name)?.hex ?? '';
    const used = [...css.matchAll(/^\s+--shiki-[a-z-]+: var\((--pp-color-[a-z-]+)\);/gm)];
    expect(used.length).toBeGreaterThan(0);
    for (const [, name] of used) {
      const ratio = contrastRatio(hex(name ?? ''), hex('--pp-color-surface'));
      expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST);
    }
  });

  it('ne contient aucune couleur brute', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(|oklch\(/i);
  });
});
