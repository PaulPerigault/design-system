import assert from 'node:assert/strict';
import process from 'node:process';
import { contrastRatio } from '@paulperigault/tokens/contrast';
import { ogImageOf, ogSlugOf } from '../src/lib/seo.ts';
import { colorsOf } from './og-colors.mjs';
import { ogFileOf } from './og-pages.mjs';
import { buildSvg } from './og-svg.mjs';
import { ellipsize, imageTitleOf, wrapText } from './og-text.mjs';

/** Même schéma que `sw.test.mjs` : `node --test`, ou primitives Vitest. */
async function runner() {
  if (!process.env.VITEST) return import('node:test');
  const vitest = await import('vitest');
  return { it: vitest.it };
}

const { it } = await runner();

const TITLE_MIN_RATIO = 7;
const BODY_MIN_RATIO = 4.5;
const colors = colorsOf();

it('contraste : titre ≥ 7:1, description ≥ 4,5:1 sur le fond', () => {
  assert.ok(contrastRatio(colors.fg, colors.bg) >= TITLE_MIN_RATIO, 'titre');
  assert.ok(contrastRatio(colors.muted, colors.bg) >= BODY_MIN_RATIO, 'description');
});

it('colorsOf lit les tokens et échoue si un rôle manque', () => {
  assert.match(colors.bg, /^#[0-9a-f]{6}$/u);
  assert.throws(() => colorsOf({ themes: { light: {} } }), /introuvable/u);
});

it('wrapText coupe aux espaces sans dépasser la largeur', () => {
  const lines = wrapText('un deux trois quatre cinq six sept', 10, 5);
  assert.deepEqual(lines, ['un deux', 'trois', 'quatre', 'cinq six', 'sept']);
  for (const line of lines) assert.ok(line.length <= 10, line);
});

it('wrapText coupe un mot plus long qu’une ligne', () => {
  assert.deepEqual(wrapText('abcdefghij', 4, 5), ['abcd', 'efgh', 'ij']);
});

it('wrapText tronque proprement avec « … » à la dernière ligne', () => {
  const lines = wrapText('alpha beta, gamma delta epsilon zeta', 12, 2);
  assert.equal(lines.length, 2);
  assert.equal(lines[1], 'gamma delta…');
  assert.ok(lines.every((line) => line.length <= 12));
});

it('ellipsize retire la ponctuation finale et tient dans la largeur', () => {
  assert.equal(ellipsize('un, deux, trois', 9), 'un, deux…');
  assert.equal(ellipsize('démesurément', 5), 'déme…');
});

it('wrapText ne produit rien pour un texte vide', () => {
  assert.deepEqual(wrapText('  ', 10, 3), []);
});

it('imageTitleOf retire le suffixe du site, l’accueil prend le nom du site', () => {
  assert.equal(imageTitleOf('Button · Design system · Paul Perigault'), 'Button');
  assert.equal(imageTitleOf('Design system · Paul Perigault'), 'Design system @paulperigault');
  assert.equal(imageTitleOf('Autre titre'), 'Autre titre');
});

it('slug : dernier segment du chemin, index pour l’accueil', () => {
  assert.equal(ogSlugOf('/'), 'index');
  assert.equal(ogSlugOf('/components/button/'), 'button');
  assert.equal(ogSlugOf('/identite'), 'identite');
  assert.equal(ogFileOf(ogImageOf('/components/button/')), 'og/button.png');
});

it('ogFileOf refuse un chemin hors de /og/<slug>.png', () => {
  assert.throws(() => ogFileOf('https://exemple.test/og/../secret.png'), /hors de/u);
  assert.throws(() => ogFileOf('https://exemple.test/img/a.png'), /hors de/u);
});

it('buildSvg : 1200 × 630, texte échappé, aucun dégradé, ombre ni flou', () => {
  const svg = buildSvg({ title: 'A & <B>', description: 'Texte', colors, logoUri: 'data:x' });
  assert.match(svg, /width="1200" height="630"/u);
  assert.match(svg, /A &#38; &#60;B&#62;/u);
  assert.doesNotMatch(svg, /gradient|filter|blur|shadow/iu);
  assert.doesNotMatch(svg, /\p{Extended_Pictographic}/u);
});

it('buildSvg : le titre sur 3 lignes laisse la description au-dessus du pied', () => {
  const title = 'mot '.repeat(80);
  const svg = buildSvg({ title, description: title, colors, logoUri: 'data:x' });
  const ys = [...svg.matchAll(/<text [^>]*y="(\d+(?:\.\d+)?)"/gu)].map((match) => Number(match[1]));
  assert.ok(ys.length > 0 && ys.every((y) => y <= 630), ys.join(','));
  assert.equal(new Set(ys).size, ys.length);
});
