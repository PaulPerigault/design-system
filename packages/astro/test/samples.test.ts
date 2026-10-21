import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SAMPLES, hasMetadata, sizeOf } from '../scripts/samples.ts';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const KB = 1024;
const budget = (file: string) => (file.endsWith('/large.jpg') ? 200 : 150) * KB;

const jpeg = (...segments: number[][]) => Uint8Array.from([0xff, 0xd8, ...segments.flat()]);
const segment = (marker: number, payload: number[]) => [
  0xff,
  marker,
  0,
  payload.length + 2,
  ...payload,
];
const SOS = [0xff, 0xda, 0, 2];

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const chunk = (type: string, data: number[]) => [
  0,
  0,
  0,
  data.length,
  ...[...type].map((c) => c.charCodeAt(0)),
  ...data,
  0,
  0,
  0,
  0,
];
const png = (...chunks: number[][]) => Uint8Array.from([...PNG_SIGNATURE, ...chunks.flat()]);
const IHDR = chunk('IHDR', [0, 0, 1, 44, 0, 0, 0, 200, 8, 2, 0, 0, 0]);

describe('hasMetadata', () => {
  it('JPEG : APP1 avant le SOS = métadonnées', () => {
    expect(hasMetadata(jpeg(segment(0xe1, [0x45, 0x78]), SOS), 'jpg')).toBe(true);
  });

  it('JPEG : APP0 seul, ou APP1 après le SOS, = aucune métadonnée', () => {
    expect(hasMetadata(jpeg(segment(0xe0, [0x4a]), SOS), 'jpg')).toBe(false);
    expect(hasMetadata(jpeg(SOS, segment(0xe1, [0x45])), 'jpg')).toBe(false);
  });

  it('PNG : eXIf ou chunk texte = métadonnées', () => {
    expect(hasMetadata(png(IHDR, chunk('eXIf', [1, 2])), 'png')).toBe(true);
    expect(hasMetadata(png(IHDR, chunk('tEXt', [0x61])), 'png')).toBe(true);
  });

  it('PNG : IHDR et IEND seuls = aucune métadonnée', () => {
    expect(hasMetadata(png(IHDR, chunk('IEND', [])), 'png')).toBe(false);
  });

  it("sizeOf lit l'IHDR et le SOF", () => {
    expect(sizeOf(png(IHDR), 'png')).toEqual({ width: 300, height: 200 });
    const sof = segment(0xc0, [8, 0, 200, 1, 44, 3]);
    expect(sizeOf(jpeg(sof, SOS), 'jpg')).toEqual({ width: 300, height: 200 });
  });
});

describe.each(SAMPLES)('$file', ({ file, format, width, height, svg }) => {
  const bytes = readFileSync(`${ROOT}${file}`);

  it('aucune métadonnée, dimensions et poids conformes', () => {
    expect(hasMetadata(bytes, format)).toBe(false);
    expect(sizeOf(bytes, format)).toEqual({ width, height });
    expect(bytes.length).toBeLessThanOrEqual(budget(file));
  });

  it('composition à aplats : ni dégradé, ni flou, ni texte, ni image externe', () => {
    expect(svg).not.toMatch(/Gradient|filter|<text|<image|href/);
  });
});
