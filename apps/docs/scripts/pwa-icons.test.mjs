import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { LOGO_PATH, generate, logoColor } from './pwa-icons.mjs';

/**
 * Test écrit pour `node --test`. Le projet Vitest `docs` ramasse aussi `scripts/**\/*.test.mjs` :
 * sous Vitest, on branche les mêmes cas sur ses primitives équivalentes.
 */
async function runner() {
  if (!process.env.VITEST) return import('node:test');
  const vitest = await import('vitest');
  return { it: vitest.it, before: vitest.beforeAll, after: vitest.afterAll };
}

const { it, before, after } = await runner();

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const EXPECTED = { 'icon-192.png': 192, 'icon-512.png': 512, 'icon-maskable-512.png': 512 };

let dir = '';
before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'pwa-icons-'));
});
after(() => rm(dir, { recursive: true, force: true }));

it('produit trois PNG valides de la bonne taille', async () => {
  await generate({ outDir: dir });
  for (const [name, size] of Object.entries(EXPECTED)) {
    const data = await readFile(join(dir, name));
    assert.ok(data.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE), name);
    const meta = await sharp(data).metadata();
    assert.deepEqual([meta.format, meta.width, meta.height], ['png', size, size], name);
  }
});

it('est idempotent : une seconde exécution ne réécrit rien', async () => {
  assert.deepEqual(await generate({ outDir: dir }), []);
});

it('maskable : fond uni de la couleur du logo, logo au centre', async () => {
  const svg = await readFile(LOGO_PATH, 'utf8');
  const hex = logoColor(svg);
  const { data, info } = await sharp(join(dir, 'icon-maskable-512.png'))
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixel = (x, y) => [...data.subarray((y * info.width + x) * info.channels).subarray(0, 3)];
  const rgb = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  assert.deepEqual(pixel(0, 0), rgb);
  assert.deepEqual(pixel(info.width - 1, info.height - 1), rgb);
  assert.deepEqual(pixel(info.width / 2 - 60, info.height / 2 - 20), [255, 255, 255]);
});

it('logoColor lit le fond du logo et refuse un SVG sans fond', () => {
  assert.equal(logoColor('<svg><rect width="1" fill="#14161c"/></svg>'), '#14161c');
  assert.throws(() => logoColor('<svg></svg>'), /introuvable/);
});
