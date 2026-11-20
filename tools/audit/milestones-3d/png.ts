// Décodeur PNG minimal (8 bits, RGB ou RGBA, sans entrelacement) : la capture d'un canvas est
// analysée dans Node, sans dépendance. Rend des pixels RGBA.
import { inflateSync } from 'node:zlib';

export interface Image {
  width: number;
  height: number;
  /** RGBA, 4 octets par pixel. */
  data: Uint8Array;
}

const SIGNATURE = '89504e470d0a1a0a';
const CHANNELS: Record<number, number> = { 2: 3, 6: 4 };
const CHUNK_OVERHEAD = 12;
const BYTE = 0xff;

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)];
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** Prédiction du filtre PNG (0 aucun, 1 gauche, 2 haut, 3 moyenne, 4 Paeth). */
const predict = (filter: number, left: number, up: number, corner: number): number =>
  [0, left, up, (left + up) >> 1, paeth(left, up, corner)][filter] ?? 0;

/** Voisins déjà décodés d'un octet : gauche, haut, haut-gauche (0 hors de l'image). */
function neighbours(
  out: Uint8Array,
  at: { x: number; y: number; stride: number; bpp: number },
): number[] {
  const { x, y, stride, bpp } = at;
  const byte = (px: number, py: number): number =>
    px >= 0 && py >= 0 ? (out[py * stride + px] ?? 0) : 0;
  return [byte(x - bpp, y), byte(x, y - 1), byte(x - bpp, y - 1)];
}

function unfilter(
  raw: Uint8Array,
  size: { width: number; height: number },
  bpp: number,
): Uint8Array {
  const stride = size.width * bpp;
  const out = new Uint8Array(stride * size.height);
  for (let y = 0; y < size.height; y += 1) {
    const filter = raw[y * (stride + 1)] ?? 0;
    for (let x = 0; x < stride; x += 1) {
      const [left = 0, up = 0, corner = 0] = neighbours(out, { x, y, stride, bpp });
      const add = predict(filter, left, up, corner);
      out[y * stride + x] = ((raw[y * (stride + 1) + 1 + x] ?? 0) + add) & BYTE;
    }
  }
  return out;
}

interface Header {
  width: number;
  height: number;
  depth: number;
  type: number;
  interlace: number;
}

function readChunks(buffer: Buffer): { header: Header; idat: Buffer } {
  const idat: Buffer[] = [];
  let header: Header = { width: 0, height: 0, depth: 0, type: 0, interlace: 0 };
  for (let at = 8; at < buffer.length;) {
    const length = buffer.readUInt32BE(at);
    const kind = buffer.toString('ascii', at + 4, at + 8);
    const body = buffer.subarray(at + 8, at + 8 + length);
    if (kind === 'IDAT') idat.push(body);
    if (kind === 'IHDR') {
      const [depth = 0, type = 0, , , interlace = 0] = body.subarray(8, 13);
      header = {
        width: body.readUInt32BE(0),
        height: body.readUInt32BE(4),
        depth,
        type,
        interlace,
      };
    }
    at += length + CHUNK_OVERHEAD;
  }
  return { header, idat: Buffer.concat(idat) };
}

export function decodePng(buffer: Buffer): Image {
  if (buffer.subarray(0, 8).toString('hex') !== SIGNATURE) throw new Error('PNG attendu');
  const { header, idat } = readChunks(buffer);
  const channels = CHANNELS[header.type];
  if (!channels || header.depth !== 8 || header.interlace !== 0) throw new Error('PNG non géré');
  const pixels = unfilter(inflateSync(idat), header, channels);
  const data = new Uint8Array(header.width * header.height * 4).fill(BYTE);
  for (let i = 0; i < header.width * header.height; i += 1) {
    for (let c = 0; c < channels; c += 1) data[i * 4 + c] = pixels[i * channels + c] ?? 0;
  }
  return { width: header.width, height: header.height, data };
}
