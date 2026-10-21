import { describe, expect, it } from 'vitest';
import Figure from '../src/media/Figure.astro';
import { renderComponent, renderDom } from './render';

const MEDIA = '<img src="a.jpg" alt="Aplat" width="10" height="10">';

describe('Figure', () => {
  it('figure : média puis figcaption avec la légende', async () => {
    const dom = await renderDom(Figure, { props: { caption: 'Atelier' }, slot: MEDIA });
    const figure = dom.querySelector('figure.pp-figure');
    expect(figure?.firstElementChild?.tagName).toBe('IMG');
    expect(figure?.lastElementChild?.tagName).toBe('FIGCAPTION');
    expect(figure?.querySelector('figcaption')?.textContent).toContain('Atelier');
    expect(figure?.querySelector('small')).toBeNull();
  });

  it('crédit : texte fourni, dans un small', async () => {
    const dom = await renderDom(Figure, {
      props: { caption: 'Atelier', credit: 'Photo : Paul Perigault' },
      slot: MEDIA,
    });
    expect(dom.querySelector('figcaption small.pp-figure__credit')?.textContent).toBe(
      'Photo : Paul Perigault',
    );
  });

  it('légende vide refusée', async () => {
    await expect(renderComponent(Figure, { props: { caption: '  ' } })).rejects.toThrow(
      /Légende vide/,
    );
  });

  it('aucun attribut style', async () => {
    const html = await renderComponent(Figure, { props: { caption: 'x', credit: 'y' } });
    expect(html).not.toMatch(/\sstyle=/);
  });
});
