import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { FONT_FAMILY, FONTS_DIR, fontFilesOf, fontOf, textPath } from './og-fonts.mjs';

/** Même schéma que `sw.test.mjs` : `node --test`, ou primitives Vitest. */
async function runner() {
  if (!process.env.VITEST) return import('node:test');
  const vitest = await import('vitest');
  return { it: vitest.it };
}

const { it } = await runner();

it('les polices fournies sont des .ttf Atkinson avec leur licence OFL', () => {
  assert.deepEqual(fontFilesOf(), [
    'AtkinsonHyperlegibleNext-Bold.ttf',
    'AtkinsonHyperlegibleNext-Regular.ttf',
  ]);
  assert.match(readFileSync(join(FONTS_DIR, 'OFL.txt'), 'utf8'), /SIL Open Font License/u);
});

it('la police chargée est Atkinson Hyperlegible Next, en deux graisses', () => {
  assert.equal(fontOf(400).familyName, FONT_FAMILY);
  assert.equal(fontOf(700).familyName, FONT_FAMILY);
  assert.equal(fontOf(400).subfamilyName, 'Regular');
  assert.equal(fontOf(700).subfamilyName, 'Bold');
});

it('textPath dessine des contours Atkinson, propres à chaque graisse', async () => {
  const args = { text: 'Illegal 1lI0O', x: 8, y: 56, size: 48, fill: '#000' };
  const regular = textPath({ ...args, weight: 400 });
  assert.match(regular, /data-font="Atkinson Hyperlegible Next"/u);
  assert.notEqual(regular, textPath({ ...args, weight: 700 }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="80">${regular}</svg>`;
  const { info } = await sharp(Buffer.from(svg)).raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 400);
});
