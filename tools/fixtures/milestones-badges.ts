// Badges de test pour la démonstration et les captures de Milestones3D : avatars géométriques
// générés, jamais de vrai badge. Sortie : WebP 512 px à fond transparent.
// Usage : `node tools/fixtures/milestones-badges.ts [--out <dossier>]`.
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { arcText } from './arc-text.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SIZE = 512;
const MID = SIZE / 2;
/** Rayon du texte en arc, juste à l'intérieur du bord du disque. */
const ARC_RADIUS = 206;

type Shape = 'hexagon' | 'circle' | 'shield';
interface Badge {
  name: string;
  shape: Shape;
  ground: string;
  ink: string;
  glyph: 'bars' | 'rings' | 'grid' | 'peaks' | 'dots' | 'waves';
  /** Texte fin en arc le long du bord : le piège des badges réels (lisibilité à petite taille). */
  arc?: string;
}

const BADGES: Badge[] = [
  { name: 'test-badge-1', shape: 'hexagon', ground: '#2b4a8c', ink: '#f2c14e', glyph: 'bars' },
  { name: 'test-badge-2', shape: 'circle', ground: '#1f7a6d', ink: '#f4f1e8', glyph: 'rings' },
  { name: 'test-badge-3', shape: 'shield', ground: '#8c2f4a', ink: '#f7d9a8', glyph: 'grid' },
  { name: 'test-badge-4', shape: 'hexagon', ground: '#3d3d3d', ink: '#7fd1b9', glyph: 'peaks' },
  { name: 'test-badge-5', shape: 'circle', ground: '#c9692b', ink: '#1d1d2b', glyph: 'dots' },
  { name: 'test-badge-6', shape: 'shield', ground: '#4b3f9e', ink: '#e8e4ff', glyph: 'waves' },
  {
    name: 'test-badge-arc',
    shape: 'circle',
    ground: '#1d3557',
    ink: '#f1faee',
    glyph: 'rings',
    arc: 'CLOUD ARCHITECT TEST',
  },
];

function outline(shape: Shape): string {
  if (shape === 'circle') return `<circle cx="${MID}" cy="${MID}" r="236"/>`;
  if (shape === 'hexagon') {
    const pts = [0, 1, 2, 3, 4, 5].map((i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${MID + 240 * Math.cos(a)},${MID + 240 * Math.sin(a)}`;
    });
    return `<polygon points="${pts.join(' ')}"/>`;
  }
  return '<path d="M256 16 L476 96 V260 C476 380 380 460 256 496 C132 460 36 380 36 260 V96 Z"/>';
}

function glyph(kind: Badge['glyph']): string {
  switch (kind) {
    case 'bars':
      return [150, 220, 290]
        .map(
          (x, i) =>
            `<rect x="${x}" y="${300 - i * 50}" width="56" height="${120 + i * 50}" transform="translate(0 -60)"/>`,
        )
        .join('');
    case 'rings':
      return [110, 70, 30]
        .map((r) => `<circle cx="${MID}" cy="${MID}" r="${r}" fill="none" stroke-width="18"/>`)
        .join('');
    case 'grid':
      return [0, 1, 2]
        .flatMap((r) =>
          [0, 1, 2].map(
            (c) => `<rect x="${158 + c * 76}" y="${150 + r * 76}" width="56" height="56"/>`,
          ),
        )
        .join('');
    case 'peaks':
      return '<path d="M120 380 L210 220 L270 320 L330 240 L400 380 Z"/>';
    case 'dots':
      return [0, 1, 2, 3, 4]
        .map(
          (i) =>
            `<circle cx="${MID + 90 * Math.cos(i * 1.2566)}" cy="${MID + 90 * Math.sin(i * 1.2566)}" r="30"/>`,
        )
        .join('');
    default:
      return [200, 260, 320]
        .map(
          (y) =>
            `<path d="M120 ${y} q34 -40 68 0 t68 0 t68 0 t68 0" fill="none" stroke-width="20"/>`,
        )
        .join('');
  }
}

function svg(b: Badge): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
<g fill="${b.ground}">${outline(b.shape)}</g>
<g fill="${b.ink}" stroke="${b.ink}">${glyph(b.glyph)}</g>${b.arc ? arcText(b.arc, b.ink, MID, ARC_RADIUS) : ''}</svg>`;
}

const { values } = parseArgs({ options: { out: { type: 'string' } } });
const out = resolve(ROOT, values.out ?? 'apps/docs/public/milestones-3d');
mkdirSync(out, { recursive: true });
for (const badge of BADGES) {
  const file = join(out, `${badge.name}.webp`);
  await sharp(Buffer.from(svg(badge)))
    .webp({ quality: 90 })
    .toFile(file);
  console.log(file);
}
