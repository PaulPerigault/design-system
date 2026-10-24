// Métadonnées d'un PNG : chunks parcourus après la signature jusqu'à IEND, sans dépendance.
// `eXIf` → exif (+ gps) ; `tEXt`/`zTXt`/`iTXt` de mot-clé XMP → xmp, « Raw profile type exif » → exif.
// Entrée non fiable : un chunk tronqué arrête la lecture, rien ne lève. CRC non vérifiés.
import { Buffer } from 'node:buffer';
import { tiffHasGps } from './jpeg.ts';

export const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const LENGTH_SIZE = 4;
const TYPE_SIZE = 4;
const CRC_SIZE = 4;
const CHUNK_HEADER = LENGTH_SIZE + TYPE_SIZE;
const NUL = 0;
const IEND = 'IEND';
const EXIF_CHUNK = 'eXIf';
const TEXT_CHUNKS = new Set(['tEXt', 'zTXt', 'iTXt']);
const KEYWORDS = new Map([
  ['XML:com.adobe.xmp', 'xmp'],
  ['Raw profile type exif', 'exif'],
]);

function keywordOf(data: Buffer): string {
  const end = data.indexOf(NUL);
  return data.toString('latin1', 0, end === -1 ? data.length : end);
}

function chunkFindings(type: string, data: Buffer): string[] {
  if (type === EXIF_CHUNK) return tiffHasGps(data) ? ['exif', 'gps'] : ['exif'];
  const finding = TEXT_CHUNKS.has(type) ? KEYWORDS.get(keywordOf(data)) : undefined;
  return finding ? [finding] : [];
}

export function pngMetadata(bytes: Buffer): string[] {
  const found = new Set<string>();
  let offset = PNG_SIGNATURE.length;
  while (offset + CHUNK_HEADER <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('latin1', offset + LENGTH_SIZE, offset + CHUNK_HEADER);
    const end = offset + CHUNK_HEADER + length + CRC_SIZE;
    if (type === IEND || end > bytes.length) break;
    const data = bytes.subarray(offset + CHUNK_HEADER, end - CRC_SIZE);
    for (const finding of chunkFindings(type, data)) found.add(finding);
    offset = end;
  }
  return [...found];
}
