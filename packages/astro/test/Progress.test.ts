import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Progress from '../src/feedback/Progress.astro';
import { renderDom } from './render';

const base = { id: 'upload', label: 'Envoi du fichier' };

const render = (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Progress, { props: { ...base, ...props } });

const bar = async (props: Record<string, unknown> = {}): Promise<Element> => {
  const element = (await render(props)).querySelector('.pp-progress__bar');
  if (!element) throw new Error('barre absente');
  return element;
};

describe('Progress (rendu)', () => {
  it('rend un <progress> natif par défaut (rôle implicite progressbar)', async () => {
    const element = await bar({ value: 0.5 });
    expect(element.tagName).toBe('PROGRESS');
    expect(element.hasAttribute('role')).toBe(false);
    expect(element.getAttribute('value')).toBe('0.5');
    expect(element.getAttribute('max')).toBe('1');
  });

  it('nomme la barre par <label for>, sans texte en dur', async () => {
    const document = await render({ value: 1 });
    const label = document.querySelector('label');
    expect(label?.getAttribute('for')).toBe('upload');
    expect(document.getElementById('upload')).not.toBeNull();
    expect(label?.textContent?.trim()).toBe('Envoi du fichier');
    expect(document.body.textContent?.trim()).toBe('Envoi du fichier');
  });

  it('sans value : indéterminé, sans aria-describedby', async () => {
    const element = await bar();
    expect(element.hasAttribute('value')).toBe(false);
    expect(element.hasAttribute('aria-describedby')).toBe(false);
  });

  it('affiche valueText et le relie par aria-describedby', async () => {
    const document = await render({ value: 3, max: 5, valueText: '3 sur 5' });
    const element = document.querySelector('progress');
    expect(element?.getAttribute('max')).toBe('5');
    expect(element?.getAttribute('aria-describedby')).toBe('upload-value');
    expect(document.getElementById('upload-value')?.textContent).toBe('3 sur 5');
  });

  it('rend un <meter> avec low, high et optimum', async () => {
    const props = { kind: 'meter', value: 0.7, low: 0.3, high: 0.8, optimum: 0.9 };
    const element = await bar(props);
    expect(element.tagName).toBe('METER');
    expect(element.getAttribute('low')).toBe('0.3');
    expect(element.getAttribute('high')).toBe('0.8');
    expect(element.getAttribute('optimum')).toBe('0.9');
  });

  it('ignore low, high et optimum pour progress', async () => {
    const element = await bar({ value: 0.2, low: 0.3, high: 0.8, optimum: 0.9 });
    expect(element.hasAttribute('low')).toBe(false);
    expect(element.hasAttribute('high')).toBe(false);
    expect(element.hasAttribute('optimum')).toBe(false);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await render({ kind: 'meter', value: 1, low: 0, valueText: 'Plein' });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Progress (source CSS)', () => {
  const source = readFileSync(new URL('../src/feedback/Progress.astro', import.meta.url), 'utf8');

  it('stylise les pseudo-éléments natifs sur appearance: none', () => {
    expect(source).toContain('appearance: none');
    expect(source).toContain('::-webkit-progress-value');
    expect(source).toContain('::-moz-progress-bar');
    expect(source).toContain('::-webkit-meter-optimum-value');
  });

  it('retire l’animation indéterminée sous reduce', () => {
    expect(source).toMatch(/prefers-reduced-motion: reduce[\s\S]*:indeterminate[\s\S]*none/);
  });
});
