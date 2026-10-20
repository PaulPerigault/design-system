import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Status from '../src/feedback/Status.astro';
import { renderDom } from './render';

const STATES = ['passed', 'failed', 'degraded', 'running'] as const;

const render = async (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Status, { props: { label: 'Réussi', ...props } });

const root = async (props: Record<string, unknown> = {}): Promise<Element> => {
  const element = (await render(props)).querySelector('.pp-status');
  if (!element) throw new Error('racine .pp-status absente');
  return element;
};

describe('Status (rendu)', () => {
  it('rend un span avec les défauts', async () => {
    const element = await root();
    expect(element.tagName.toLowerCase()).toBe('span');
    expect(element.getAttribute('data-state')).toBe('running');
    expect(element.hasAttribute('data-mono')).toBe(false);
  });

  it.each(STATES)('reporte state="%s" dans data-state', async (state) => {
    expect((await root({ state })).getAttribute('data-state')).toBe(state);
  });

  it('pose data-mono quand mono est vrai', async () => {
    expect((await root({ mono: true })).getAttribute('data-mono')).toBe('true');
  });

  it('ne pose aucun rôle', async () => {
    const document = await render();
    expect(document.querySelectorAll('[role]')).toHaveLength(0);
  });

  it('expose le libellé comme nom accessible, icône masquée', async () => {
    const element = await root({ label: 'Échec' });
    expect(element.textContent?.trim()).toBe('Échec');
    expect(element.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.querySelector('svg title')).toBeNull();
  });

  it('donne une forme d’icône distincte à chaque état', async () => {
    const shapes = await Promise.all(
      STATES.map(async (state) => (await root({ state })).querySelector('path')?.getAttribute('d')),
    );
    expect(new Set(shapes).size).toBe(STATES.length);
  });

  it('transmet `class` à côté de pp-status', async () => {
    const element = await root({ class: 'placement' });
    expect(element.classList.contains('pp-status')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await render({ state: 'failed', mono: true });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Status (source CSS)', () => {
  const source = readFileSync(new URL('../src/feedback/Status.astro', import.meta.url), 'utf8');

  it.each(STATES)('mappe data-state="%s" vers --pp-color-status-%s', (state) => {
    const rule = new RegExp(
      `\\[data-state='${state}'\\]\\s*\\{\\s*--status-color:\\s*var\\(--pp-color-status-${state}\\);`,
    );
    expect(source).toMatch(rule);
  });

  it('colore l’icône seulement', () => {
    expect(source).toMatch(/\.pp-status__icon\s*\{[^}]*color: var\(--status-color\)/);
    expect(source).toMatch(/\.pp-status\s*\{[^}]*color: var\(--pp-color-fg\)/);
  });
});
