/** Lecture d'en-têtes JPEG et PNG octet par octet, sans dépendance. */
import type { SampleFormat } from './samples.ts';

export interface Size {
  width: number;
  height: number;
}

const BYTE = 8;
const MARKER = 0xff;
const APP1 = 0xe1;
const SOS = 0xda;
const SOF0 = 0xc0;
const SOF2 = 0xc2;
const SOI_LENGTH = 2;
const SEGMENT_HEADER = 2;
/** Décalages dans un segment SOF : hauteur puis largeur, après longueur et précision. */
const SOF_HEIGHT = 5;
const SOF_WIDTH = 7;
const PNG_SIGNATURE = 8;
const CHUNK_HEADER = 8;
const CHUNK_CRC = 4;
const UINT32 = 4;
const UINT16 = 2;
const UINT16_RANGE = 0x10000;
const PNG_TEXT_CHUNKS = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt']);

const uint16 = (bytes: Uint8Array, at: number): number =>
  ((bytes[at] ?? 0) << BYTE) | (bytes[at + 1] ?? 0);

const uint32 = (bytes: Uint8Array, at: number): number =>
  uint16(bytes, at) * UINT16_RANGE + uint16(bytes, at + UINT16);

/** Segments JPEG `[marqueur, début]` jusqu'au SOS exclu. */
function* jpegSegments(bytes: Uint8Array): Generator<[number, number]> {
  let at = SOI_LENGTH;
  while (at + SEGMENT_HEADER < bytes.length && bytes[at] === MARKER) {
    const marker = bytes[at + 1] ?? 0;
    if (marker === SOS) return;
    yield [marker, at];
    at += SEGMENT_HEADER + uint16(bytes, at + SEGMENT_HEADER);
  }
}

/** Chunks PNG `[type, début]`. */
function* pngChunks(bytes: Uint8Array): Generator<[string, number]> {
  let at = PNG_SIGNATURE;
  while (at + CHUNK_HEADER <= bytes.length) {
    const type = String.fromCharCode(...bytes.subarray(at + UINT32, at + CHUNK_HEADER));
    yield [type, at];
    at += CHUNK_HEADER + uint32(bytes, at) + CHUNK_CRC;
  }
}

/** Vrai si l'image porte des métadonnées (APP1 EXIF/XMP en JPEG, chunks texte ou EXIF en PNG). */
export function hasMetadata(bytes: Uint8Array, format: SampleFormat): boolean {
  if (format === 'jpg') return [...jpegSegments(bytes)].some(([marker]) => marker === APP1);
  return [...pngChunks(bytes)].some(([type]) => PNG_TEXT_CHUNKS.has(type));
}

/** Dimensions lues dans l'en-tête (SOF0/SOF2 pour JPEG, IHDR pour PNG). */
export function sizeOf(bytes: Uint8Array, format: SampleFormat): Size | undefined {
  if (format === 'png') {
    const at = PNG_SIGNATURE + CHUNK_HEADER;
    return { width: uint32(bytes, at), height: uint32(bytes, at + UINT32) };
  }
  for (const [marker, at] of jpegSegments(bytes)) {
    if (marker === SOF0 || marker === SOF2) {
      return { width: uint16(bytes, at + SOF_WIDTH), height: uint16(bytes, at + SOF_HEIGHT) };
    }
  }
  return undefined;
}
