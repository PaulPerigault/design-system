import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { checkOgImages, pngSize } from './og-check.mjs';
import { generate, targetsOf } from './og.mjs';
import { decodeEntities, readOgMeta } from './og-pages.mjs';

/** Même schéma que `sw.test.mjs` : `node --test`, ou primitives Vitest. */
async function runner() {
  if (!process.env.VITEST) return import('node:test');
  const vitest = await import('vitest');
  return { it: vitest.it };
}

const { it } = await runner();

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const IMAGE = 'https://design.paulperigault.dev/og/button.png';

/** En-tête PNG minimal : signature, longueur, type IHDR, largeur, hauteur. */
function png(width, height) {
  const head = Buffer.alloc(24);
  Buffer.from(SIGNATURE).copy(head);
  head.write('IHDR', 12, 'latin1');
  head.writeUInt32BE(width, 16);
  head.writeUInt32BE(height, 20);
  return head;
}

/** Système de fichiers en mémoire : `files` associe chemin → contenu. */
function memoryFs(files) {
  return {
    list: async () => Object.keys(files).filter((name) => name.endsWith('.html')),
    read: async (path) => {
      const data = files[path.replace('/dist/', '')];
      if (data === undefined) throw new Error('ENOENT');
      return Buffer.from(data);
    },
    write: async (path, data) => {
      files[path.replace('/dist/', '')] = data;
    },
  };
}

const htmlOf = (image) => `<meta content="${image}" property="og:image"><meta property=og:x>`;
const page = { file: 'components/button/index.html', image: IMAGE };
const options = (files) => ({ fs: memoryFs(files), distDir: '/dist' });

it('readOgMeta lit les trois balises, dans n’importe quel ordre d’attributs', () => {
  const html = `${htmlOf(IMAGE)}<meta property="og:title" content="A &amp; B &#233;">`;
  assert.deepEqual(readOgMeta(html), { image: IMAGE, title: 'A & B é', description: null });
  assert.equal(decodeEntities('&lt;&#x41;&inconnu;'), '<A&inconnu;');
});

it('pngSize lit IHDR et refuse ce qui n’est pas un PNG', () => {
  assert.deepEqual(pngSize(png(1200, 630)), { width: 1200, height: 630 });
  assert.equal(pngSize(Buffer.from('GIF89a et assez de texte pour dépasser')), null);
});

it('le contrôle passe quand le PNG 1200×630 existe', async () => {
  const files = { 'og/button.png': png(1200, 630) };
  assert.deepEqual(await checkOgImages([page], options(files)), []);
});

it('le contrôle échoue sur un fixture « image absente »', async () => {
  const problems = await checkOgImages([page], options({}));
  assert.deepEqual(problems, ['components/button/index.html : og/button.png absent']);
});

it('le contrôle échoue sur une mauvaise taille, un faux PNG ou une URL hors /og/', async () => {
  const wrong = await checkOgImages([page], options({ 'og/button.png': png(600, 315) }));
  assert.match(wrong[0], /600×315/u);
  const fake = await checkOgImages([page], options({ 'og/button.png': Buffer.alloc(40) }));
  assert.match(fake[0], /pas un PNG/u);
  const outside = await checkOgImages([{ ...page, image: 'https://a.test/x.png' }], options({}));
  assert.match(outside[0], /hors de/u);
});

it('une page sans og:image n’exige aucune image', async () => {
  assert.deepEqual(await checkOgImages([{ file: 'a.html', image: null }], options({})), []);
});

it('targetsOf refuse deux pages au même slug avec des textes différents', () => {
  const a = { file: 'a/index.html', image: IMAGE, title: 'A', description: 'a' };
  assert.equal(targetsOf([a, { ...a, file: 'b/index.html' }]).size, 1);
  assert.throws(() => targetsOf([a, { ...a, file: 'b/index.html', title: 'B' }]), /slug partagé/u);
});

it('generate écrit une image par page déclarant og:image, puis le contrôle passe', async () => {
  const files = {
    'components/button/index.html': `${htmlOf(IMAGE)}<meta property="og:title" content="Button">`,
    'sans-image/index.html': '<meta property="og:title" content="Rien">',
  };
  const fs = memoryFs(files);
  const render = async () => png(1200, 630);
  const written = await generate({ distDir: '/dist', fs, render, logoSvg: '<svg/>' });
  assert.deepEqual(written, ['og/button.png']);
  const pages = [{ file: 'components/button/index.html', image: IMAGE }];
  assert.deepEqual(await checkOgImages(pages, { fs, distDir: '/dist' }), []);
});
