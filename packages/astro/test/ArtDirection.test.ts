import type { ImageMetadata } from 'astro';
import { describe, expect, expectTypeOf, it } from 'vitest';
import ArtDirection from '../src/media/ArtDirection.astro';
import { mediaFor } from '../src/media/presets';
import type { ArtDirectionProps } from '../src/media/types';
import wide from './fixtures/sample.jpg';
import narrow from './fixtures/sample.png';
import { renderComponent, renderDom } from './render';

type Props = Record<string, unknown>;

const BASE = { src: wide, alt: 'Aplat bleu', sources: [{ at: 'narrow', src: narrow }] };
const render = (props: Props = {}): Promise<Document> =>
  renderDom(ArtDirection, { props: { ...BASE, ...props } });

const pick = (element: Element, names: string[]) => names.map((n) => element.getAttribute(n));

const img = async (props: Props = {}): Promise<Element> => {
  const element = (await render(props)).querySelector('picture > img');
  if (!element) throw new Error('<img> absent');
  return element;
};

describe('ArtDirection', () => {
  it('sources : recadrages ordonnés narrow puis medium, puis image par défaut sans media', async () => {
    const sources = [
      ...(
        await render({
          sources: [
            { at: 'medium', src: wide },
            { at: 'narrow', src: narrow },
          ],
        })
      ).querySelectorAll('source'),
    ];
    const narrowQuery = mediaFor('narrow');
    const mediumQuery = mediaFor('medium');
    expect(sources.map((source) => pick(source, ['media', 'type']))).toEqual([
      [narrowQuery, 'image/avif'],
      [narrowQuery, 'image/webp'],
      [mediumQuery, 'image/avif'],
      [mediumQuery, 'image/webp'],
      [null, 'image/avif'],
      [null, 'image/webp'],
    ]);
  });

  it('chaque source porte les dimensions de son propre recadrage', async () => {
    const sources = [...(await render()).querySelectorAll('source')];
    expect(sources.map((source) => pick(source, ['width', 'height']))).toEqual([
      ['300', '300'],
      ['300', '300'],
      ['600', '400'],
      ['600', '400'],
    ]);
    expect(sources.every((source) => source.getAttribute('srcset')?.includes('w'))).toBe(true);
  });

  it('img : alt, dimensions et sizes ; décorative → alt vide', async () => {
    expect(pick(await img(), ['alt', 'width', 'height'])).toEqual(['Aplat bleu', '600', '400']);
    expect((await img()).getAttribute('sizes')).toMatch(/rem/);
    expect((await img({ alt: undefined, decorative: true })).getAttribute('alt')).toBe('');
  });

  it('priority : eager et high ; sinon lazy et async', async () => {
    const names = ['loading', 'fetchpriority', 'decoding'];
    expect(pick(await img({ priority: true }), names).slice(0, 2)).toEqual(['eager', 'high']);
    expect(pick(await img(), names)).toEqual(['lazy', null, 'async']);
  });

  it('cadre sans data-ratio, aucun attribut style', async () => {
    const html = await renderComponent(ArtDirection, { props: BASE });
    expect(html).not.toMatch(/\sstyle=|data-ratio/);
    expect(html).toMatch(/class="pp-media"/);
  });

  it('image distante dans les recadrages : erreur au build', async () => {
    await expect(
      render({ sources: [{ at: 'narrow', src: 'https://exemple.test/a.jpg' }] }),
    ).rejects.toThrow(/distante/);
  });

  it('types : sources typées par point de rupture', () => {
    type Base = { src: ImageMetadata; alt: string };
    expectTypeOf<
      Base & { sources: { at: 'narrow'; src: ImageMetadata }[] }
    >().toExtend<ArtDirectionProps>();
    expectTypeOf<
      Base & { sources: { at: 'large'; src: ImageMetadata }[] }
    >().not.toExtend<ArtDirectionProps>();
  });
});
