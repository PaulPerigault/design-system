/**
 * Images d'exemple du lot images : compositions géométriques à aplats, sans visage, sans texte,
 * sans dégradé, écrites sans métadonnées. `node packages/astro/scripts/samples.ts` les régénère
 * (sortie déterministe).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DRAFTS, type Draft } from './sample-scenes.ts';

export type SampleFormat = 'jpg' | 'png';

export interface Sample {
  /** Chemin relatif à la racine du dépôt. */
  file: string;
  width: number;
  height: number;
  format: SampleFormat;
  svg: string;
}

const toSvg = ({ width, height, body, viewBox = `0 0 ${width} ${height}` }: Draft): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">${body}</svg>`;

export const SAMPLES: readonly Sample[] = DRAFTS.map(({ body, viewBox, ...sample }) => ({
  ...sample,
  svg: toSvg({ ...sample, body, ...(viewBox === undefined ? {} : { viewBox }) }),
}));

export { hasMetadata, sizeOf } from './metadata.ts';

const JPEG_QUALITY = 82;
const PNG_COMPRESSION = 9;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

async function write(sample: Sample): Promise<void> {
  const { default: sharp } = await import('sharp');
  const image = sharp(Buffer.from(sample.svg));
  const encoded =
    sample.format === 'jpg'
      ? image.jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      : image.png({ compressionLevel: PNG_COMPRESSION });
  const target = join(ROOT, sample.file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, await encoded.toBuffer());
  process.stdout.write(`${sample.file}\n`);
}

if (import.meta.main) {
  for (const sample of SAMPLES) await write(sample);
}
