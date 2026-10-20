import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { metadataOf } from '../src/images/metadata.mjs';

const hex = (s) => Buffer.from(s.replace(/\s/g, ''), 'hex');
const latin1 = (s) => Buffer.from(s, 'latin1');
const meta = (...parts) => metadataOf(Buffer.concat(parts));
const u16 = (n) => hex(n.toString(16).padStart(4, '0'));
const segment = (marker, payload) =>
  Buffer.concat([Buffer.from([0xff, marker]), u16(payload.length + 2), payload]);

/** En-tête TIFF + IFD0 avec les balises données, dans le boutisme demandé. */
function tiff(order, tags, count = tags.length) {
  const little = order === 'II';
  const b = Buffer.alloc(10 + tags.length * 12 + 4);
  b.write(order, 0, 'latin1');
  const w16 = (v, at) => (little ? b.writeUInt16LE(v, at) : b.writeUInt16BE(v, at));
  w16(42, 2);
  b[little ? 4 : 7] = 8; // décalage de l'IFD0 (uint32), dans le boutisme demandé
  w16(count, 8);
  tags.forEach((tag, i) => w16(tag, 10 + i * 12));
  return b;
}

const SOI = hex('ffd8');
const exif = (order, tags, count) =>
  segment(0xe1, Buffer.concat([latin1('Exif\0\0'), tiff(order, tags, count)]));
const xmp = segment(0xe1, latin1('http://ns.adobe.com/xap/1.0/\0<x/>'));
const app0 = segment(0xe0, latin1('JFIF\0\x01\x02'));
const scan = Buffer.concat([hex('ffda 0004 0000'), exif('II', [0x8825]), hex('ffd9')]);
const jpeg = (...parts) => Buffer.concat([SOI, ...parts, scan]);

const u32 = (n) => hex(n.toString(16).padStart(8, '0'));
const chunk = (type, data = Buffer.alloc(0)) =>
  Buffer.concat([u32(data.length), latin1(type), data, Buffer.alloc(4)]);
const SIGNATURE = hex('89504e470d0a1a0a');
const png = (...chunks) =>
  Buffer.concat([SIGNATURE, chunk('IHDR', Buffer.alloc(13)), ...chunks, chunk('IEND')]);
const text = (type, data) => png(chunk(type, latin1(data)));

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
    expect(metadataOf(png(chunk('eXIf', tiff('MM', []))))).toEqual(['exif']);
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
    expect(metadataOf(new Uint8Array(samples[1]))).toEqual(['exif', 'gps']);
  });
});
