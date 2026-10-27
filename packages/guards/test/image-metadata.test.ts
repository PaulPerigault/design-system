import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { metadataOf } from '../src/images/metadata.ts';
import {
  app0,
  chunk,
  exif,
  hex,
  jpeg,
  latin1,
  png,
  segment,
  SIGNATURE,
  SOI,
  text,
  tiff,
  xmp,
} from './image-fixtures.ts';

const meta = (...parts: Buffer[]) => metadataOf(Buffer.concat(parts));

describe('metadataOf : JPEG', () => {
  it('lit Exif II et MM, avec et sans GPS', () => {
    expect(metadataOf(jpeg(app0, exif('II', [0x010f, 0x8825])))).toEqual(['exif', 'gps']);
    expect(metadataOf(jpeg(exif('MM', [0x8825])))).toEqual(['exif', 'gps']);
    expect(metadataOf(jpeg(exif('II', [0x010f, 0x0112])))).toEqual(['exif']);
    expect(metadataOf(jpeg(exif('MM', [0x2588])))).toEqual(['exif']);
  });

  it('lit XMP, ordonne les constats et ignore ce qui suit SOS', () => {
    expect(metadataOf(jpeg(xmp, exif('MM', [0x8825])))).toEqual(['exif', 'gps', 'xmp']);
    expect(metadataOf(jpeg(app0))).toEqual([]);
    expect(metadataOf(jpeg(hex('ffff'), xmp))).toEqual(['xmp']);
  });

  it('borne un IFD dont le compte ment ou un TIFF invalide', () => {
    expect(metadataOf(jpeg(exif('II', [0x8825], 0xffff)))).toEqual(['exif', 'gps']);
    expect(metadataOf(jpeg(exif('II', [], 0xffff)))).toEqual(['exif']);
    const badOrder = segment(0xe1, Buffer.concat([latin1('Exif\0\0XX'), Buffer.alloc(12)]));
    expect(metadataOf(jpeg(badOrder))).toEqual(['exif']);
    const farIfd = segment(0xe1, Buffer.concat([latin1('Exif\0\0'), hex('4d4d002a7fffffff')]));
    expect(metadataOf(jpeg(farIfd))).toEqual(['exif']);
  });

  it('rend ce qui précède une longueur nulle, trop courte ou qui déborde', () => {
    expect(meta(SOI, xmp, hex('ffe1 0000'), exif('II', []))).toEqual(['xmp']);
    expect(meta(SOI, hex('ffe1 0001'), xmp)).toEqual([]);
    expect(meta(SOI, xmp, hex('ffe1 ffff 4578'))).toEqual(['xmp']);
    expect(meta(SOI, xmp, hex('00ff'), xmp)).toEqual(['xmp']);
  });
});

describe('metadataOf : PNG', () => {
  it('lit eXIf et les mots-clés des chunks texte', () => {
    const exifOf = (order: 'II' | 'MM', tags: number[]) =>
      metadataOf(png(chunk('eXIf', tiff(order, tags))));
    expect([exifOf('II', [0x010f]), exifOf('II', [0x8825])]).toEqual([['exif'], ['exif', 'gps']]);
    expect(metadataOf(text('iTXt', 'XML:com.adobe.xmp\0\0\0\0\0<x/>'))).toEqual(['xmp']);
    expect(metadataOf(text('zTXt', 'XML:com.adobe.xmp\0\0xx'))).toEqual(['xmp']);
    expect(metadataOf(text('tEXt', 'Raw profile type exif\0\n'))).toEqual(['exif']);
    expect(metadataOf(text('tEXt', 'Comment\0XML:com.adobe.xmp'))).toEqual([]);
    expect(metadataOf(text('tEXt', 'XML:com.adobe.xmp'))).toEqual(['xmp']);
  });

  it('propre, après IEND, chunk vide, tronqué ou qui déborde', () => {
    expect(metadataOf(png(chunk('tIME', Buffer.alloc(7))))).toEqual([]);
    expect(meta(png(), chunk('eXIf', Buffer.alloc(8)))).toEqual([]);
    expect(metadataOf(png(chunk('IDAT'), chunk('eXIf')))).toEqual(['exif']);
    const cut = png(chunk('iTXt', latin1('XML:com.adobe.xmp\0')), chunk('eXIf', Buffer.alloc(8)));
    expect(metadataOf(cut.subarray(0, cut.length - 20))).toEqual(['xmp']);
    expect(meta(SIGNATURE, hex('ffffffff'), latin1('eXIf'))).toEqual([]);
  });
});

describe('metadataOf : robustesse', () => {
  const samples = [
    jpeg(app0, xmp, exif('II', [0x8825])),
    jpeg(exif('MM', [0x8825])),
    png(chunk('iTXt', latin1('XML:com.adobe.xmp\0')), chunk('eXIf', tiff('II', [0x8825]))),
  ];

  it('ne lève jamais sur une troncature ou un octet altéré', () => {
    for (const sample of samples) {
      for (let end = 0; end <= sample.length; end += 1) {
        expect(() => metadataOf(sample.subarray(0, end))).not.toThrow();
      }
      for (let at = 0; at < sample.length; at += 1) {
        for (const value of [0x00, 0x01, 0x7f, 0xff]) {
          const altered = Buffer.from(sample);
          altered[at] = value;
          expect(() => metadataOf(altered)).not.toThrow();
        }
      }
    }
  });

  it('reconnaît le format à la signature, ignore les autres', () => {
    expect(metadataOf(new Uint8Array(0))).toEqual([]);
    expect(metadataOf(latin1('GIF89a'))).toEqual([]);
    expect(metadataOf(new Uint8Array(samples[1] ?? []))).toEqual(['exif', 'gps']);
  });
});
