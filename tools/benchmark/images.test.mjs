import { describe, expect, it } from 'vitest';
import { median, parseName, percent, ratio, summarize, table, widthsFrom } from './images-core.mjs';

const file = (name, bytes) => ({ name, bytes });
const FILES = [
  file('photo.ABC.jpg', 900),
  file('photo.ABC_w1.avif', 100),
  file('photo.ABC_w1.webp', 200),
  file('photo.ABC_w1.jpg', 400),
  file('photo.ABC_w2.avif', 300),
  file('notes.txt', 5),
];
const HTML = '<img srcset="/_astro/photo.ABC_w1.avif 320w, /_astro/photo.ABC_w2.avif 640w">';

describe('parseName', () => {
  it('distingue original, variante et format de repli', () => {
    expect(parseName('photo.ABC.jpg')).toEqual({
      source: 'photo.ABC',
      format: 'repli',
      original: true,
    });
    expect(parseName('photo.ABC_w1.avif')).toMatchObject({ format: 'avif', original: false });
    expect(parseName('photo.ABC_w1.png')).toMatchObject({ format: 'repli' });
  });

  it('ignore ce qui n’est pas une image du pipeline', () => {
    expect(parseName('notes.txt')).toBeNull();
  });
});

describe('summarize et table', () => {
  it('compte les variantes et les octets par format', () => {
    const [row] = summarize(FILES);
    expect(row.original).toBe(900);
    expect(row.formats.avif).toEqual({ count: 2, bytes: 400 });
    expect(row.formats.webp).toEqual({ count: 1, bytes: 200 });
  });

  it('écrit une ligne par source et un total', () => {
    const lines = table(summarize(FILES)).split('\n');
    expect(lines).toHaveLength(4);
    expect(lines.at(-1)).toContain('**Total**');
  });
});

describe('ratio', () => {
  it('compare deux formats à même largeur', () => {
    const widths = widthsFrom(HTML);
    expect(widths.get('photo.ABC_w1.avif')).toBe(320);
    const files = FILES.map((f) => f);
    widths.set('photo.ABC_w1.webp', 320);
    const result = ratio(files, widths, 'avif', 'webp');
    expect(result).toEqual({ pairs: 1, median: 0.5 });
    expect(percent(result.median)).toBe('50 %');
    expect(percent(null)).toBe('n/a');
  });
});

describe('median', () => {
  it('gère pair, impair et vide', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});
