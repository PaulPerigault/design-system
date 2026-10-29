// Métadonnées sensibles (EXIF, GPS, XMP) des images versionnées, format reconnu à la signature.
// Limite : seuls JPEG et PNG sont analysés (fichiers `.jpg`, `.jpeg`, `.png`). WebP, AVIF,
// GIF, HEIC et SVG ne le sont pas : leurs métadonnées éventuelles passent ce contrôle.
import { Buffer } from 'node:buffer';
import type { GuardIo } from '../ports.ts';
import type { Problem } from '../../domain/problem.ts';
import { SOI, jpegMetadata } from '../../domain/images/jpeg.ts';
import { PNG_SIGNATURE, pngMetadata } from '../../domain/images/png.ts';

export const METADATA_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const FINDINGS = ['exif', 'gps', 'xmp'];

const startsWith = (bytes: Buffer, prefix: Buffer): boolean =>
  bytes.subarray(0, prefix.length).equals(prefix);

export function metadataOf(bytes: Uint8Array): string[] {
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let found: string[] = [];
  if (startsWith(buffer, SOI)) found = jpegMetadata(buffer);
  else if (startsWith(buffer, PNG_SIGNATURE)) found = pngMetadata(buffer);
  return FINDINGS.filter((finding) => found.includes(finding));
}

export function metadataProblems(io: GuardIo, files: string[]): Problem[] {
  return files.flatMap((file) => {
    const found = metadataOf(io.readBytes(file));
    if (found.length === 0) return [];
    const command = `exiftool -all= -overwrite_original "${file}"`;
    return [
      { file, message: `métadonnées ${found.join(', ')} (vie privée) : nettoyer avec ${command}` },
    ];
  });
}
