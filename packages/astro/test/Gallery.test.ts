import { readFileSync } from 'node:fs';
import tokens from '@paulperigault/tokens/tokens.json';
import type { ImageMetadata } from 'astro';
import { describe, expect, expectTypeOf, it } from 'vitest';
import Gallery from '../src/media/Gallery.astro';
import type { GalleryProps } from '../src/media/types';
import jpg from './fixtures/sample.jpg';
import png from './fixtures/sample.png';
import { renderComponent, renderDom } from './render';

const ITEMS = [
  { src: jpg, alt: 'Aplat bleu', caption: 'Bande claire en bas.' },
  { src: png, alt: 'Disque orange' },
];
const LABELS = { open: 'Agrandir', close: 'Fermer' };
const PLAIN = { id: 'g', items: ITEMS };
const ENLARGE = { ...PLAIN, enlarge: true, labels: LABELS };
const source = readFileSync(new URL('../src/media/Gallery.astro', import.meta.url), 'utf8');
const measure = parseFloat(tokens.base['--pp-size-measure']);
const THREE_QUARTERS = 0.75;

describe('Gallery', () => {
  it('liste role="list", un li par image ; sans enlarge ni bouton ni dialog', async () => {
    const dom = await renderDom(Gallery, { props: PLAIN });
    expect(dom.querySelector('ul')?.getAttribute('role')).toBe('list');
    expect(dom.querySelectorAll('ul > li')).toHaveLength(ITEMS.length);
    expect(dom.querySelectorAll('button, dialog')).toHaveLength(0);
    expect(dom.querySelectorAll('.pp-media[data-ratio="square"]')).toHaveLength(ITEMS.length);
  });

  it('enlarge : chaque bouton ouvre un dialog existant, nommé par l’alternative', async () => {
    const dom = await renderDom(Gallery, { props: ENLARGE });
    const openers = [...dom.querySelectorAll('li > button')];
    expect(openers).toHaveLength(ITEMS.length);
    openers.forEach((button, index) => {
      const target = button.getAttribute('commandfor') ?? '';
      const dialog = dom.getElementById(target);
      expect(button.getAttribute('command')).toBe('show-modal');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('aria-label')).toBe(`Agrandir : ${ITEMS[index]?.alt}`);
      expect(dialog?.tagName).toBe('DIALOG');
      expect(dialog?.getAttribute('aria-label')).toBe(ITEMS[index]?.alt);
      expect(dialog?.getAttribute('closedby')).toBe('any');
    });
  });

  it('enlarge : bouton de fermeture par dialog, image différée', async () => {
    const dom = await renderDom(Gallery, { props: ENLARGE });
    const dialogs = [...dom.querySelectorAll('dialog')];
    for (const dialog of dialogs) {
      const close = dialog.querySelector('button[command="close"]');
      expect(close?.getAttribute('commandfor')).toBe(dialog.id);
      expect(close?.textContent?.trim()).toBe('Fermer');
      expect(dialog.querySelector('img')?.getAttribute('loading')).toBe('lazy');
    }
  });

  it('légende si fournie, reliée au dialog par aria-describedby', async () => {
    const dom = await renderDom(Gallery, { props: ENLARGE });
    const [first, second] = [...dom.querySelectorAll('dialog')];
    const describedBy = first?.getAttribute('aria-describedby') ?? '';
    expect(dom.getElementById(describedBy)?.textContent).toContain('Bande claire en bas.');
    expect(second?.querySelector('p')).toBeNull();
    expect(second?.hasAttribute('aria-describedby')).toBe(false);
  });

  it('identifiants uniques, aucun script ni style', async () => {
    const html = await renderComponent(Gallery, { props: ENLARGE });
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(html).not.toMatch(/<script|\sstyle=/);
  });

  it('seuils @container égaux aux trois quarts de la mesure et à la mesure', () => {
    const thresholds = [...source.matchAll(/@container \(min-width: ([\d.]+)rem\)/g)].map((match) =>
      Number(match[1]),
    );
    expect(thresholds).toEqual([measure * THREE_QUARTERS, measure]);
  });

  it('types : enlarge exige labels, alt obligatoire', () => {
    type Item = { src: ImageMetadata; alt: string };
    expectTypeOf<{ id: string; items: Item[] }>().toExtend<GalleryProps>();
    expectTypeOf<{ id: string; items: Item[]; enlarge: true }>().not.toExtend<GalleryProps>();
    expectTypeOf<{ id: string; items: { src: ImageMetadata }[] }>().not.toExtend<GalleryProps>();
  });
});
