import { describe, expect, it } from 'vitest';
import { GRID_INTENSITY, SCENARIOS, pageViewGrams } from './carbon.mjs';
import { classify, pageWeight, references, sum } from './weight-core.mjs';

const HTML = `<html><head>
<link rel="preload" href="/_astro/f.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/_astro/a.css">
<link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="https://cdn.example/x.css">
<script type="module" src="/_astro/a.js"></script>
</head><body><img src="/image/p.avif" alt=""><img src="/_astro/a.css" alt=""></body></html>`;

describe('classify', () => {
  it('range les extensions par type', () => {
    expect(
      ['a.css', 'a.js', 'a.woff2', 'a.avif', 'a.wasm', 'a.html', 'a.txt'].map(classify),
    ).toEqual(['css', 'js', 'font', 'image', 'wasm', 'html', null]);
  });
});

describe('references', () => {
  it('garde styles, scripts, polices préchargées et images locales, sans doublon', () => {
    expect(references(HTML)).toEqual([
      '/_astro/f.woff2',
      '/_astro/a.css',
      '/_astro/a.js',
      '/image/p.avif',
    ]);
  });
});

describe('pageWeight', () => {
  it('additionne par type et ignore un fichier absent', () => {
    const files = {
      '/_astro/a.css': Buffer.alloc(1000, 97),
      '/_astro/f.woff2': Buffer.alloc(500, 1),
    };
    const weight = pageWeight(HTML, (path) => files[path] ?? null);
    expect(weight.css.raw).toBe(1000);
    expect(weight.font.raw).toBe(500);
    expect(weight.js.raw).toBe(0);
    expect(weight.html.raw).toBe(Buffer.byteLength(HTML));
    expect(sum(weight, 'raw')).toBe(1500 + Buffer.byteLength(HTML));
    expect(weight.css.gzip).toBeLessThan(weight.css.raw);
  });
});

describe('pageViewGrams (Sustainable Web Design v4)', () => {
  const GIGABYTE = 1e9;
  it('un Go pour un nouveau visiteur : 0,300 kWh × 494 g/kWh', () => {
    expect(GRID_INTENSITY).toBe(494);
    expect(pageViewGrams(GIGABYTE, SCENARIOS.newVisitor)).toBeCloseTo(148.2, 6);
  });

  it('un visiteur de retour avec cache à 50 % compte moitié moins', () => {
    expect(pageViewGrams(GIGABYTE, SCENARIOS.returnVisitor)).toBeCloseTo(74.1, 6);
  });

  it('un hébergement vert retire la part opérationnelle des centres de données', () => {
    const green = { ...SCENARIOS.newVisitor, greenHosting: 1 };
    expect(pageViewGrams(GIGABYTE, green)).toBeCloseTo(148.2 - 0.055 * 494, 6);
    expect(pageViewGrams(0, SCENARIOS.newVisitor)).toBe(0);
  });
});
