import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Toast from '../src/feedback/Toast.astro';
import { renderDom } from './render';

const render = async (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Toast, { props: { label: 'Notifications', dismissLabel: 'Fermer', ...props } });

const region = async (props: Record<string, unknown> = {}): Promise<Element> => {
  const element = (await render(props)).querySelector('.pp-toast-region');
  if (!element) throw new Error('région .pp-toast-region absente');
  return element;
};

describe('Toast (rendu)', () => {
  it('rend une région status polie, non atomique, vide', async () => {
    const element = await region();
    expect(element.tagName.toLowerCase()).toBe('div');
    expect(element.getAttribute('role')).toBe('status');
    expect(element.getAttribute('aria-live')).toBe('polite');
    expect(element.getAttribute('aria-atomic')).toBe('false');
    expect(element.children).toHaveLength(0);
  });

  it('nomme la région avec label', async () => {
    expect((await region({ label: 'Messages' })).getAttribute('aria-label')).toBe('Messages');
  });

  it('transmet dismissLabel à data-dismiss-label', async () => {
    const element = await region({ dismissLabel: 'Masquer' });
    expect(element.getAttribute('data-dismiss-label')).toBe('Masquer');
  });

  it('transmet `class` à côté de pp-toast-region', async () => {
    const element = await region({ class: 'placement' });
    expect(element.classList.contains('pp-toast-region')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    expect((await render()).querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Toast (source CSS)', () => {
  const source = readFileSync(new URL('../src/feedback/Toast.astro', import.meta.url), 'utf8');

  it.each([
    ['success', 'passed'],
    ['error', 'failed'],
  ])('mappe data-tone="%s" vers --pp-color-status-%s', (tone, status) => {
    const rule = new RegExp(
      `\\[data-tone='${tone}'\\]\\s*\\{\\s*--toast-tone:\\s*var\\(--pp-color-status-${status}\\);`,
    );
    expect(source).toMatch(rule);
  });

  it('supprime l’animation sous prefers-reduced-motion', () => {
    expect(source).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*\{\s*animation: none/);
  });

  it('garde une cible tactile minimale sur le bouton de fermeture', () => {
    expect(source).toMatch(/__close\s*\{[^}]*min-block-size: max\([^}]*--pp-size-target-min/);
  });

  it('charge le behavior par un script du composant', () => {
    expect(source).toMatch(/<script>\s*import \{ install \} from '\.\.\/behaviors\/toast'/);
  });
});
