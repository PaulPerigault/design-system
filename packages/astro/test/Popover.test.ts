import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Popover from '../src/overlay/Popover.astro';
import { renderDom } from './render';

const render = async (props: Record<string, unknown> = {}, slot = '<p>Contenu</p>') =>
  renderDom(Popover, { props: { id: 'p1', triggerLabel: 'Détails', ...props }, slot });

const query = async (selector: string, props: Record<string, unknown> = {}): Promise<Element> => {
  const element = (await render(props)).querySelector(selector);
  if (!element) throw new Error(`${selector} absent`);
  return element;
};

describe('Popover (rendu)', () => {
  it('rend un bouton nommé par triggerLabel', async () => {
    const button = await query('button');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.textContent?.trim()).toBe('Détails');
  });

  it('relie le bouton au panneau par popovertarget', async () => {
    const button = await query('button', { id: 'mon-id' });
    const panel = await query('.pp-popover__panel', { id: 'mon-id' });
    expect(button.getAttribute('popovertarget')).toBe('mon-id');
    expect(button.getAttribute('popovertargetaction')).toBe('toggle');
    expect(panel.getAttribute('id')).toBe('mon-id');
    expect(panel.getAttribute('popover')).toBe('auto');
  });

  it('place le slot dans le panneau', async () => {
    expect((await query('.pp-popover__panel p')).textContent).toBe('Contenu');
  });

  it('lève une erreur claire sans id', async () => {
    await expect(render({ id: '' })).rejects.toThrow(/id/);
  });

  it('transmet `class` à côté de pp-popover', async () => {
    const root = await query('.pp-popover', { class: 'placement' });
    expect(root.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style ni script', async () => {
    const document = await render();
    expect(document.querySelectorAll('[style], script')).toHaveLength(0);
  });
});

describe('Popover (source CSS)', () => {
  const css = readFileSync(new URL('../src/overlay/popover.css', import.meta.url), 'utf8');
  const component = readFileSync(new URL('../src/overlay/Popover.astro', import.meta.url), 'utf8');

  it('importe sa feuille globale', () => {
    expect(component).toContain("import './popover.css'");
  });

  it('ancre le panneau dans un bloc @supports', () => {
    expect(css).toMatch(/@supports \(anchor-name: --x\)[\s\S]*position-area/);
    expect(css).toContain('anchor-name: --pp-popover');
  });

  it('borne la largeur par --pp-size-measure et la fenêtre', () => {
    expect(css).toMatch(/max-inline-size: min\(var\(--pp-size-measure\)/);
  });

  it('prévoit forced-colors et exclut ombre, flou et dégradé', () => {
    expect(css).toMatch(/forced-colors: active[\s\S]*CanvasText/);
    expect(css).not.toMatch(/box-shadow|backdrop-filter|gradient/);
  });
});
