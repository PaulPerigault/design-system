// Métadonnées sensibles (EXIF, GPS, XMP) des images versionnées, format reconnu à la signature.
// Limite : seuls JPEG et PNG sont analysés (fichiers `.jpg`, `.jpeg`, `.png`). WebP, AVIF,
// GIF, HEIC et SVG ne le sont pas : leurs métadonnées éventuelles passent ce contrôle.
import { Buffer } from 'node:buffer';
import { SOI, jpegMetadata } from './jpeg.ts';
import { PNG_SIGNATURE, pngMetadata } from './png.ts';

export const METADATA_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const FINDINGS = ['exif', 'gps', 'xmp'];

/** @param {Buffer} bytes @param {Buffer} prefix */
const startsWith = (bytes, prefix) => bytes.subarray(0, prefix.length).equals(prefix);

/**
 * Constats de métadonnées, dans l'ordre `exif`, `gps`, `xmp` ; vide si propre ou inconnu.
 * @param {Uint8Array} bytes contenu brut du fichier
 * @returns {string[]}
 */
export function metadataOf(bytes) {
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let found = [];
  if (startsWith(buffer, SOI)) found = jpegMetadata(buffer);
  else if (startsWith(buffer, PNG_SIGNATURE)) found = pngMetadata(buffer);
  return FINDINGS.filter((finding) => found.includes(finding));
}

/**
 * @param {import('../lib/io.ts').GuardIo} io
 * @param {string[]} files images JPEG ou PNG (par extension)
 * @returns {import('../lib/report.ts').Problem[]}
 */
export function metadataProblems(io, files) {
  return files.flatMap((file) => {
    const found = metadataOf(io.readBytes(file));
    if (found.length === 0) return [];
    const command = `exiftool -all= -overwrite_original "${file}"`;
    return [
      { file, message: `métadonnées ${found.join(', ')} (vie privée) : nettoyer avec ${command}` },
    ];
  });
}
