import type { ImageMetadata } from 'astro';
import { describe, expect, expectTypeOf, it } from 'vitest';
import Photo from '../src/media/Photo.astro';
import { sizesFor } from '../src/media/presets';
import type { AltProps, PhotoProps } from '../src/media/types';
import sample from './fixtures/sample.jpg';
import { renderComponent, renderDom } from './render';

type Props = Record<string, unknown>;

const render = (props: Props = {}): Promise<Document> =>
  renderDom(Photo, { props: { src: sample, alt: 'Aplat bleu', ...props } });

const img = async (props: Props = {}): Promise<HTMLImageElement> => {
  const element = (await render(props)).querySelector('img');
  if (!element) throw new Error('<img> absent');
  return element as HTMLImageElement;
};

const attributes = (element: Element, names: string[]) =>
  names.map((name) => element.getAttribute(name));

describe('Photo (rendu de Picture)', () => {
  it('deux <source> AVIF puis WebP, avant le <img> de repli', async () => {
    const sources = [...(await render()).querySelectorAll('picture > source')];
    expect(sources.map((source) => source.getAttribute('type'))).toEqual([
      'image/avif',
      'image/webp',
    ]);
  });

  it('img : alt, width et height toujours rendus, sizes tiré du layout', async () => {
    const image = await img({ layout: 'half' });
    expect(attributes(image, ['alt', 'width', 'height'])).toEqual(['Aplat bleu', '600', '400']);
    expect(image.getAttribute('sizes')).toBe(sizesFor('half'));
    expect((await img()).getAttribute('sizes')).toBe(sizesFor('measure'));
  });

  it('repli JPEG pour une photo, PNG pour une capture', async () => {
    expect((await img()).getAttribute('src')).toMatch(/f=jpg/);
    expect((await img({ kind: 'capture' })).getAttribute('src')).toMatch(/f=png/);
  });

  it('décorative : alt vide', async () => {
    const image = await img({ alt: undefined, decorative: true });
    expect(image.getAttribute('alt')).toBe('');
  });

  it('priority : chargement immédiat et prioritaire ; sinon différé et asynchrone', async () => {
    const names = ['loading', 'fetchpriority', 'decoding'];
    expect(attributes(await img({ priority: true }), names).slice(0, 2)).toEqual(['eager', 'high']);
    expect(attributes(await img(), names)).toEqual(['lazy', null, 'async']);
  });

  it('cadre : data-ratio, data-focal (center par défaut), data-rule', async () => {
    const frame = (await render({ ratio: 'portrait', focal: 'top', rule: true })).querySelector(
      '.pp-media',
    );
    expect(frame && attributes(frame, ['data-ratio', 'data-focal', 'data-rule'])).toEqual([
      'portrait',
      'top',
      '',
    ]);
    const plain = (await render()).querySelector('.pp-media');
    expect(plain && attributes(plain, ['data-ratio', 'data-focal'])).toEqual([null, 'center']);
    expect(plain?.hasAttribute('data-rule')).toBe(false);
  });

  it("fond d'attente : couleur dominante en fill #rrggbb, masqué aux technologies d'assistance", async () => {
    const svg = (await render()).querySelector('svg.pp-media__placeholder');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.querySelector('rect')?.getAttribute('fill')).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('aucun attribut style dans tout le HTML (CSP)', async () => {
    const html = await renderComponent(Photo, { props: { src: sample, alt: 'x', ratio: 'wide' } });
    expect(html).not.toMatch(/\sstyle=/);
  });

  it('alt vide ou image distante : erreur au build', async () => {
    await expect(render({ alt: ' ' })).rejects.toThrow(/Texte alternatif vide/);
    await expect(render({ src: 'https://exemple.test/a.jpg' })).rejects.toThrow(/distante/);
  });

  it('types : alt ou decorative, jamais les deux ni aucun', () => {
    type Base = { src: ImageMetadata };
    expectTypeOf<Base & AltProps>().toExtend<PhotoProps>();
    expectTypeOf<Base>().not.toExtend<PhotoProps>();
    expectTypeOf<Base & { alt: string; decorative: true }>().not.toExtend<PhotoProps>();
  });
});
