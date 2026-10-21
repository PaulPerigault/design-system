import { describe, expect, it } from 'vitest';
import Accordion from '../src/content/Accordion.astro';
import { renderDom } from './render';

const ITEMS = [
  { id: 'a', summary: 'Premier point' },
  { id: 'b', summary: 'Second point', open: true },
];

const render = async (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Accordion, { props: { items: ITEMS, ...props } });

describe('Accordion (rendu)', () => {
  it('rend un details et un summary par élément, avec leur nom accessible', async () => {
    const document = await render();
    const summaries = [...document.querySelectorAll('details > summary')];
    expect(summaries.map((summary) => summary.textContent?.trim())).toEqual([
      'Premier point',
      'Second point',
    ]);
  });

  it('ouvre seulement les éléments marqués open', async () => {
    const document = await render();
    const [first, second] = [...document.querySelectorAll('details')];
    expect(first?.hasAttribute('open')).toBe(false);
    expect(second?.hasAttribute('open')).toBe(true);
  });

  it('ne pose pas d’attribut name par défaut', async () => {
    const document = await render();
    expect(document.querySelectorAll('details[name]')).toHaveLength(0);
  });

  it('partage un même name entre les panneaux avec exclusive', async () => {
    const document = await render({ exclusive: true });
    const names = [...document.querySelectorAll('details')].map((d) => d.getAttribute('name'));
    expect(names[0]).toBeTruthy();
    expect(new Set(names).size).toBe(1);
  });

  it('dérive des noms différents pour des accordéons différents', async () => {
    const one = await render({ exclusive: true });
    const other = await render({ exclusive: true, items: [{ id: 'z', summary: 'Autre' }] });
    expect(one.querySelector('details')?.getAttribute('name')).not.toBe(
      other.querySelector('details')?.getAttribute('name'),
    );
  });

  it('masque le chevron aux technologies d’assistance', async () => {
    const document = await render();
    const chevrons = [...document.querySelectorAll('summary svg')];
    expect(chevrons).toHaveLength(ITEMS.length);
    for (const chevron of chevrons) expect(chevron.getAttribute('aria-hidden')).toBe('true');
  });

  it('applique la classe de placement sur la racine', async () => {
    const document = await render({ class: 'placement' });
    expect(document.querySelector('.pp-accordion')?.classList.contains('placement')).toBe(true);
  });

  it('n’émet aucun attribut style', async () => {
    const document = await render({ exclusive: true });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});
