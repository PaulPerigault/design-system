import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Alert from '../src/feedback/Alert.astro';
import { renderDom } from './render';

const TONES = ['info', 'passed', 'degraded', 'failed'] as const;
const STATUS = { info: 'running', passed: 'passed', degraded: 'degraded', failed: 'failed' };
const BASE = { toneLabel: 'Information' };

const render = async (props: Record<string, unknown> = {}, slot = '<p>Corps</p>') =>
  renderDom(Alert, { props: { ...BASE, ...props }, slot });

const root = async (props: Record<string, unknown> = {}, slot?: string): Promise<Element> => {
  const element = (await render(props, slot)).querySelector('.pp-alert');
  if (!element) throw new Error('racine .pp-alert absente');
  return element;
};

describe('Alert (rendu)', () => {
  it('rend un div sans rôle, ton info par défaut', async () => {
    const element = await root();
    expect(element.tagName.toLowerCase()).toBe('div');
    expect(element.hasAttribute('role')).toBe(false);
    expect(element.getAttribute('data-tone')).toBe('info');
  });

  it.each(TONES)('reporte tone="%s" dans data-tone', async (tone) => {
    expect((await root({ tone })).getAttribute('data-tone')).toBe(tone);
  });

  it.each([
    ['polite', 'status'],
    ['assertive', 'alert'],
  ])('live="%s" pose role="%s"', async (live, role) => {
    expect((await root({ live })).getAttribute('role')).toBe(role);
  });

  it('affiche le libellé du ton en texte visible', async () => {
    const tone = (await root({ toneLabel: 'Échec' })).querySelector('.pp-alert__tone');
    expect(tone?.textContent?.trim()).toBe('Échec');
  });

  it('rend le titre seulement s’il est fourni', async () => {
    const titled = await root({ title: 'Build cassé' });
    expect(titled.querySelector('.pp-alert__title')?.textContent).toBe('Build cassé');
    expect((await root()).querySelector('.pp-alert__title')).toBeNull();
  });

  it.each(TONES)('icône décorative, retirée de l’arbre d’accessibilité (%s)', async (tone) => {
    const svg = (await root({ tone })).querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
    expect(svg?.querySelector('path')?.getAttribute('d')).toBeTruthy();
  });

  it('sépare le ton et le titre par une espace lue', async () => {
    const element = await root({ toneLabel: 'Attention', title: 'Lent', live: 'polite' });
    expect(element.querySelector('.pp-alert__heading')?.textContent?.trim()).toBe('Attention Lent');
    expect(element.querySelector('.pp-alert__content')?.textContent).toBe('Corps');
  });

  it('transmet `class` à côté de pp-alert', async () => {
    const element = await root({ class: 'placement' });
    expect(element.classList.contains('pp-alert')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await render({ tone: 'failed', title: 'T', live: 'assertive' });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Alert (source CSS)', () => {
  const source = readFileSync(new URL('../src/feedback/Alert.astro', import.meta.url), 'utf8');

  it.each(TONES)('mappe data-tone="%s" vers une couleur de statut', (tone) => {
    const rule = `\\.pp-alert\\[data-tone='${tone}'\\]\\s*\\{\\s*--alert-tone:\\s*`;
    expect(source).toMatch(new RegExp(`${rule}var\\(--pp-color-status-${STATUS[tone]}\\);`));
  });

  it('réserve la couleur de statut à l’icône et au filet de début', () => {
    expect(source.match(/var\(--alert-tone\)/g)).toHaveLength(2);
    expect(source).toContain('border-inline-start: var(--pp-space-3xs) solid var(--alert-tone)');
    expect(source).toContain('background-color: var(--pp-color-surface)');
  });

  it('vise les enfants du slot via :global(', () => {
    expect(source).toContain('.pp-alert__content > :global(* + *)');
  });
});
