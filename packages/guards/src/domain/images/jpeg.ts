// Métadonnées d'un JPEG : segments lus de SOI jusqu'à SOS (ou EOI), sans dépendance.
// APP1 `Exif\0\0` → exif (+ gps si l'IFD0 porte GPSInfo), APP1 XMP → xmp.
// Entrée non fiable : chaque lecture est bornée, chaque pas avance, rien ne lève.
import { Buffer } from 'node:buffer';

export const SOI = Buffer.from('ffd8', 'hex');
const MARKER = 0xff;
const SOS = 0xda;
const EOI = 0xd9;
const APP1 = 0xe1;
const TEM = 0x01;
const RST0 = 0xd0;
const SOI_MARKER = 0xd8;
const MARKER_SIZE = 2;
const LENGTH_SIZE = 2;
const SEGMENT_HEADER = MARKER_SIZE + LENGTH_SIZE;
const EXIF_ID = Buffer.from('Exif\0\0', 'latin1');
const XMP_ID = Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'latin1');

const TIFF_HEADER_SIZE = 8;
const TIFF_MAGIC = 0x2a;
const TIFF_MAGIC_OFFSET = 2;
const IFD0_OFFSET = 4;
const BYTE_ORDER_SIZE = 2;
const SHORT_SIZE = 2;
const IFD_ENTRY_SIZE = 12;
const GPS_INFO_TAG = 0x8825;

const startsWith = (bytes: Buffer, prefix: Buffer): boolean =>
  bytes.subarray(0, prefix.length).equals(prefix);

const isStandalone = (marker: number): boolean =>
  marker === TEM || (marker >= RST0 && marker <= SOI_MARKER);

function tiffReader(
  tiff: Buffer,
): { short: (at: number) => number; long: (at: number) => number } | null {
  if (tiff.length < TIFF_HEADER_SIZE) return null;
  const order = tiff.toString('latin1', 0, BYTE_ORDER_SIZE);
  if (order !== 'II' && order !== 'MM') return null;
  const little = order === 'II';
  const short = (at: number): number => (little ? tiff.readUInt16LE(at) : tiff.readUInt16BE(at));
  const long = (at: number): number => (little ? tiff.readUInt32LE(at) : tiff.readUInt32BE(at));
  return short(TIFF_MAGIC_OFFSET) === TIFF_MAGIC ? { short, long } : null;
}

export function tiffHasGps(tiff: Buffer): boolean {
  const read = tiffReader(tiff);
  if (!read) return false;
  const ifd = read.long(IFD0_OFFSET);
  if (ifd + SHORT_SIZE > tiff.length) return false;
  const available = Math.floor((tiff.length - ifd - SHORT_SIZE) / IFD_ENTRY_SIZE);
  const count = Math.min(read.short(ifd), available);
  for (let i = 0; i < count; i += 1) {
    if (read.short(ifd + SHORT_SIZE + i * IFD_ENTRY_SIZE) === GPS_INFO_TAG) return true;
  }
  return false;
}

function inspectApp1(data: Buffer, found: Set<string>): void {
  if (startsWith(data, EXIF_ID)) {
    found.add('exif');
    if (tiffHasGps(data.subarray(EXIF_ID.length))) found.add('gps');
  } else if (startsWith(data, XMP_ID)) {
    found.add('xmp');
  }
}

function segmentEnd(bytes: Buffer, offset: number): number | null {
  if (offset + SEGMENT_HEADER > bytes.length) return null;
  const length = bytes.readUInt16BE(offset + MARKER_SIZE);
  const end = offset + MARKER_SIZE + length;
  return length < LENGTH_SIZE || end > bytes.length ? null : end;
}

interface StepResult {
  next: number;
  marker?: number | undefined;
}

function step(bytes: Buffer, offset: number): StepResult | null {
  if (offset + MARKER_SIZE > bytes.length || bytes[offset] !== MARKER) return null;
  const marker = bytes[offset + 1];
  if (marker === undefined || marker === MARKER) return { next: offset + 1 };
  return afterMarker(bytes, offset, marker);
}

function afterMarker(bytes: Buffer, offset: number, marker: number): StepResult | null {
  if (marker === SOS || marker === EOI) return null;
  if (isStandalone(marker)) return { next: offset + MARKER_SIZE };
  const end = segmentEnd(bytes, offset);
  return end === null ? null : { next: end, marker };
}

export function jpegMetadata(bytes: Buffer): string[] {
  const found = new Set<string>();
  let offset = SOI.length;
  for (let current = step(bytes, offset); current; current = step(bytes, offset)) {
    if (current.marker !== undefined && current.marker === APP1) {
      inspectApp1(bytes.subarray(offset + SEGMENT_HEADER, current.next), found);
    }
    offset = current.next;
  }
  return [...found];
}
