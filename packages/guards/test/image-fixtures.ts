import { Buffer } from 'node:buffer';

export const hex = (s: string) => Buffer.from(s.replace(/\s/g, ''), 'hex');
export const latin1 = (s: string) => Buffer.from(s, 'latin1');
const u16 = (n: number) => hex(n.toString(16).padStart(4, '0'));
export const segment = (marker: number, payload: Buffer) =>
  Buffer.concat([Buffer.from([0xff, marker]), u16(payload.length + 2), payload]);

/** En-tête TIFF + IFD0 avec les balises données, dans le boutisme demandé. */
export function tiff(order: 'II' | 'MM', tags: number[], count = tags.length): Buffer {
  const little = order === 'II';
  const b = Buffer.alloc(10 + tags.length * 12 + 4);
  b.write(order, 0, 'latin1');
  const w16 = (v: number, at: number) => (little ? b.writeUInt16LE(v, at) : b.writeUInt16BE(v, at));
  w16(42, 2);
  b[little ? 4 : 7] = 8; // décalage de l'IFD0 (uint32), dans le boutisme demandé
  w16(count, 8);
  tags.forEach((tag, i) => w16(tag, 10 + i * 12));
  return b;
}

export const SOI = hex('ffd8');
export const exif = (order: 'II' | 'MM', tags: number[], count?: number) =>
  segment(0xe1, Buffer.concat([latin1('Exif\0\0'), tiff(order, tags, count)]));
export const xmp = segment(0xe1, latin1('http://ns.adobe.com/xap/1.0/\0<x/>'));
export const app0 = segment(0xe0, latin1('JFIF\0\x01\x02'));
const scan = Buffer.concat([hex('ffda 0004 0000'), exif('II', [0x8825]), hex('ffd9')]);
export const jpeg = (...parts: Buffer[]) => Buffer.concat([SOI, ...parts, scan]);

const u32 = (n: number) => hex(n.toString(16).padStart(8, '0'));
export const chunk = (type: string, data: Buffer = Buffer.alloc(0)) =>
  Buffer.concat([u32(data.length), latin1(type), data, Buffer.alloc(4)]);
export const SIGNATURE = hex('89504e470d0a1a0a');
export const png = (...chunks: Buffer[]) =>
  Buffer.concat([SIGNATURE, chunk('IHDR', Buffer.alloc(13)), ...chunks, chunk('IEND')]);
export const text = (type: string, data: string) => png(chunk(type, latin1(data)));
