import type { ImageMetadata } from 'astro';
import { describe, expect, expectTypeOf, it } from 'vitest';
import Avatar from '../src/media/Avatar.astro';
import ProjectCover from '../src/media/ProjectCover.astro';
import { sizesFor } from '../src/media/presets';
import type { AvatarProps, ProjectCoverProps } from '../src/media/types';
import sample from './fixtures/sample.jpg';
import { renderComponent, renderDom } from './render';

type Props = Record<string, unknown>;
type Base = { src: ImageMetadata };

const avatar = (props: Props = {}) =>
  renderDom(Avatar, { props: { src: sample, decorative: true, ...props } });
const cover = (props: Props = {}) =>
  renderDom(ProjectCover, { props: { src: sample, alt: 'Capture du projet', ...props } });

describe('Avatar', () => {
  it('taille par data-size (m par défaut), cadre carré, focal haut', async () => {
    expect((await avatar()).querySelector('.pp-avatar')?.getAttribute('data-size')).toBe('m');
    const dom = await avatar({ size: 'l' });
    expect(dom.querySelector('.pp-avatar')?.getAttribute('data-size')).toBe('l');
    const frame = dom.querySelector('.pp-avatar > .pp-media');
    expect([frame?.getAttribute('data-ratio'), frame?.getAttribute('data-focal')]).toEqual([
      'square',
      'top',
    ]);
  });

  it('alt transmis, ou alt vide si décoratif ; sizes du preset avatar', async () => {
    expect((await avatar()).querySelector('img')?.getAttribute('alt')).toBe('');
    const img = (await avatar({ decorative: undefined, alt: 'Paul' })).querySelector('img');
    expect(img?.getAttribute('alt')).toBe('Paul');
    expect(img?.getAttribute('sizes')).toBe(sizesFor('avatar'));
  });
});

describe('ProjectCover', () => {
  it('filet, ratio paysage et layout third par défaut', async () => {
    const dom = await cover();
    const frame = dom.querySelector('.pp-media');
    expect(frame?.hasAttribute('data-rule')).toBe(true);
    expect(frame?.getAttribute('data-ratio')).toBe('landscape');
    expect(dom.querySelector('img')?.getAttribute('sizes')).toBe(sizesFor('third'));
  });

  it('ratio, layout et priorité transmis', async () => {
    const dom = await cover({ ratio: 'wide', layout: 'half', priority: true });
    expect(dom.querySelector('.pp-media')?.getAttribute('data-ratio')).toBe('wide');
    const img = dom.querySelector('img');
    expect(img?.getAttribute('sizes')).toBe(sizesFor('half'));
    expect(img?.getAttribute('fetchpriority')).toBe('high');
  });

  it('capture par défaut : repli PNG ; photo : repli JPEG', async () => {
    expect((await cover()).querySelector('img')?.getAttribute('src')).toMatch(/f=png/);
    expect((await cover({ kind: 'photo' })).querySelector('img')?.getAttribute('src')).toMatch(
      /f=jpg/,
    );
  });

  it('aucun attribut style', async () => {
    const props = { src: sample, alt: 'x' };
    expect(await renderComponent(ProjectCover, { props })).not.toMatch(/\sstyle=/);
    expect(await renderComponent(Avatar, { props })).not.toMatch(/\sstyle=/);
  });
});

describe('types', () => {
  it('alt ou decorative obligatoire', () => {
    expectTypeOf<Base & { decorative: true }>().toExtend<AvatarProps>();
    expectTypeOf<Base>().not.toExtend<AvatarProps>();
    expectTypeOf<Base & { alt: string }>().toExtend<ProjectCoverProps>();
    expectTypeOf<Base>().not.toExtend<ProjectCoverProps>();
    expectTypeOf<Base & { alt: string; ratio: 'square' }>().not.toExtend<ProjectCoverProps>();
  });
});
