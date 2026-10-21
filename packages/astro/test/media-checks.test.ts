import type { ImageMetadata } from 'astro';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { altOf, assertLocal, imagePath } from '../src/media/checks';
import type { AltProps } from '../src/media/types';

const metadata = (): ImageMetadata => ({
  src: '/_astro/photo.hash.jpg',
  width: 1600,
  height: 1200,
  format: 'jpg',
});

describe('altOf', () => {
  it('rend le texte alternatif fourni', () => {
    expect(altOf({ alt: 'Paul au tableau blanc' })).toBe('Paul au tableau blanc');
  });

  it('rend une chaîne vide pour une image décorative', () => {
    expect(altOf({ decorative: true })).toBe('');
  });

  it('refuse un texte vide ou blanc, et un alt absent à l’exécution', () => {
    expect(() => altOf({ alt: '' })).toThrow(TypeError);
    expect(() => altOf({ alt: '  \n ' })).toThrow(/decorative/);
    expect(() => altOf({} as AltProps)).toThrow(TypeError);
  });
});

describe('AltProps : types', () => {
  it('accepte alt seul ou decorative seul', () => {
    expectTypeOf({ alt: 'x' }).toExtend<AltProps>();
    expectTypeOf({ decorative: true as const }).toExtend<AltProps>();
  });

  it('refuse ni l’un ni l’autre, les deux, et decorative à false', () => {
    // @ts-expect-error ni alt ni decorative
    const none: AltProps = {};
    // @ts-expect-error alt et decorative ensemble
    const both: AltProps = { alt: 'x', decorative: true };
    // @ts-expect-error decorative ne peut valoir que true
    const off: AltProps = { decorative: false };
    expect([none, both, off]).toHaveLength(3);
  });
});

describe('assertLocal', () => {
  it('accepte une image importée', () => {
    expect(() => assertLocal(metadata())).not.toThrow();
  });

  it('refuse une URL distante', () => {
    expect(() => assertLocal('https://example.com/photo.jpg')).toThrow(/distante/);
  });

  it('refuse un objet sans métadonnées complètes', () => {
    expect(() => assertLocal(null)).toThrow(TypeError);
    expect(() => assertLocal({ src: '/a.jpg', width: 10, height: 10 })).toThrow(/format/);
    expect(() => assertLocal({ ...metadata(), width: '1600' })).toThrow(TypeError);
  });

  it('affine le type après l’assertion', () => {
    const value: unknown = metadata();
    assertLocal(value);
    expectTypeOf(value).toEqualTypeOf<ImageMetadata>();
    expect(value.width).toBe(1600);
  });
});

describe('imagePath', () => {
  it('lit fsPath non énumérable, comme posé par Astro 7.4', () => {
    const asset = metadata();
    Object.defineProperty(asset, 'fsPath', { value: '/projet/src/photo.jpg', enumerable: false });
    expect(Object.keys(asset)).not.toContain('fsPath');
    expect(imagePath(asset)).toBe('/projet/src/photo.jpg');
  });

  it('rend undefined sans fsPath exploitable', () => {
    expect(imagePath(metadata())).toBeUndefined();
    const odd = metadata();
    Object.defineProperty(odd, 'fsPath', { value: 42, enumerable: false });
    expect(imagePath(odd)).toBeUndefined();
  });
});
