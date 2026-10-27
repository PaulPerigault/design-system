import { Buffer } from 'node:buffer';
import { parseArgs } from 'node:util';
import { describe, expect, it } from 'vitest';
import * as images from '../src/check-images.ts';
import { budgetFor, budgetSettings, BYTES_PER_KB } from '../src/images/budget.ts';
import { GuardUsageError } from '../src/lib/report.ts';
import { fakeIo } from './fake-io.ts';

const kb = (n: number) => new Uint8Array(n * BYTES_PER_KB);
// SOI, APP1 Exif `II` dont l'IFD0 porte GPSInfo (0x8825), EOI.
const exifPayload = `457869660000 49492a0008000000 0100 2588 ${'0'.repeat(28)}`;
const gpsJpeg = Buffer.from(`ffd8 ffe1 0022 ${exifPayload} ffd9`.replaceAll(' ', ''), 'hex');

describe('budget', () => {
  const settings = budgetSettings({
    maxKb: 500,
    budgets: [
      { path: 'src/assets', maxKb: 300 },
      { path: './src/assets/hero/', maxKb: 400 },
    ],
  });

  it('retient le chemin le plus long qui couvre le fichier, sinon maxKb', () => {
    expect(budgetFor('src/assets/hero/a.jpg', settings)).toBe(400);
    expect(budgetFor('src/assets/card/a.jpg', settings)).toBe(300);
    expect(budgetFor('src/assets/heroes/a.jpg', settings)).toBe(300);
    expect(budgetFor('public/a.png', settings)).toBe(500);
  });

  it('accepte des chaînes de la CLI et refuse un budget non positif', () => {
    const fromCli = budgetSettings({ maxKb: '250', budgets: '[{"path":"a","maxKb":"10"}]' });
    expect(fromCli).toEqual({ maxKb: 250, budgets: [{ path: 'a', maxKb: 10 }] });
    for (const maxKb of [0, -1, 'abc', '', Number.NaN, undefined]) {
      expect(() => budgetSettings({ maxKb, budgets: [] })).toThrow(GuardUsageError);
    }
    const bad = [[{ path: 'a', maxKb: 0 }], [{ maxKb: 1 }], '{', {}];
    for (const budgets of bad) {
      expect(() => budgetSettings({ maxKb: 1, budgets })).toThrow(GuardUsageError);
    }
  });
});

describe('run', () => {
  it('expose le contrat de module et des options parseArgs valides', () => {
    expect(images.name).toBe('images');
    expect(images.defaults).toEqual({
      roots: ['src', 'public'],
      allow: ['src/media'],
      maxKb: 500,
      budgets: [],
    });
    const args = ['--allow', 'a', '--allow', 'b', '--maxKb', '9', 'src'];
    const { values } = parseArgs({ args, options: images.cliOptions, allowPositionals: true });
    expect(values).toEqual({ allow: ['a', 'b'], maxKb: '9' });
  });

  it('retourne 0 sur un dépôt propre, balisage permis sous src/media', () => {
    const { io, out, err } = fakeIo({
      'src/media/Photo.astro': '<img src={src} />',
      'packages/astro/src/media/Img.astro': '<img>',
      'src/pages/a.astro': '<Image src={a} />',
      'public/a.png': kb(1),
    });
    expect(images.run({ ...images.defaults, roots: ['src', 'public', 'packages'] }, io)).toBe(0);
    expect(err).toEqual([]);
    expect(out).toEqual(['images : OK (4 fichiers)']);
  });

  it('signale balisage, métadonnées et budget avec fichier et ligne', () => {
    const { io, err } = fakeIo({
      'src/pages/a.astro': '---\n---\n<img src="a.png">',
      'src/styles/b.css': '.x {\n  background-image: url(x.png);\n}',
      'public/me.jpg': gpsJpeg,
      'src/assets/hero/big.webp': kb(401),
      'src/assets/small.svg': kb(2),
    });
    const budgets = [{ path: 'src/assets/hero', maxKb: 400 }];
    expect(images.run({ ...images.defaults, maxKb: 1, budgets }, io)).toBe(1);
    expect(err).toEqual([
      'src/pages/a.astro:3: <img> brut interdit hors src/media : utiliser Photo',
      'src/styles/b.css:2: background-image: url( interdit hors src/media : utiliser Photo',
      'public/me.jpg: métadonnées exif, gps (vie privée) : nettoyer avec exiftool -all= -overwrite_original "public/me.jpg"',
      'src/assets/hero/big.webp: 401 Ko > budget 400 Ko',
      'src/assets/small.svg: 2 Ko > budget 1 Ko',
    ]);
  });

  it('traite les extensions sans tenir compte de la casse', () => {
    const { io, err } = fakeIo({ 'public/ME.JPG': gpsJpeg, 'src/A.Astro': '<img src="a">' });
    expect(images.run({ ...images.defaults }, io)).toBe(1);
    expect(err).toEqual([
      'src/A.Astro:1: <img> brut interdit hors src/media : utiliser Photo',
      'public/ME.JPG: métadonnées exif, gps (vie privée) : nettoyer avec exiftool -all= -overwrite_original "public/ME.JPG"',
    ]);
  });

  it('lève GuardUsageError pour un maxKb non positif', () => {
    const { io } = fakeIo({});
    expect(() => images.run({ ...images.defaults, maxKb: 0 }, io)).toThrow(GuardUsageError);
  });
});
