/** Compositions des images d'exemple : aplats aux teintes de l'identité plus une teinte chaude. */
import type { Sample } from './samples.ts';

export type Draft = Omit<Sample, 'svg'> & { body: string; viewBox?: string };

const PAPER = '#f9fafd';
const MIST = '#eff1f6';
const LINE = '#d6d9e0';
const SLATE = '#4b4f5c';
const ACCENT = '#3749c3';
const SKY = '#8da1e4';
const INK = '#14161c';
const CLAY = '#c8693a';

const MEDIA = 'apps/docs/src/assets/media';
const FIXTURES = 'packages/astro/test/fixtures';

/** Paysage : fond encre dominant, collines en aplats, soleil chaud. */
const LANDSCAPE = `<rect width="1800" height="1200" fill="${INK}"/>
<rect y="840" width="1800" height="360" fill="${SLATE}"/>
<rect x="0" y="960" width="900" height="240" fill="${ACCENT}"/>
<circle cx="1320" cy="420" r="150" fill="${CLAY}"/>`;

/** Grand format : bande d'horizon et sujet (disque et colonne) au centre droit. */
const WIDE = `<rect width="2400" height="1350" fill="${MIST}"/>
<rect y="1000" width="2400" height="350" fill="${LINE}"/>
<rect x="1100" y="300" width="160" height="700" fill="${SLATE}"/>
<circle cx="1500" cy="520" r="220" fill="${ACCENT}"/>`;

export const DRAFTS: readonly Draft[] = [
  { file: `${MEDIA}/paysage.jpg`, width: 1800, height: 1200, format: 'jpg', body: LANDSCAPE },
  {
    file: `${MEDIA}/portrait.jpg`,
    width: 1200,
    height: 1500,
    format: 'jpg',
    body: `<rect width="1200" height="1500" fill="${PAPER}"/>
<rect x="300" y="160" width="600" height="420" fill="${SKY}"/>
<rect x="0" y="1180" width="1200" height="320" fill="${SLATE}"/>`,
  },
  {
    file: `${MEDIA}/carre.jpg`,
    width: 1200,
    height: 1200,
    format: 'jpg',
    body: `<rect width="1200" height="1200" fill="${ACCENT}"/>
<circle cx="600" cy="480" r="220" fill="${SKY}"/>
<rect x="300" y="780" width="600" height="420" fill="${PAPER}"/>`,
  },
  { file: `${MEDIA}/large.jpg`, width: 2400, height: 1350, format: 'jpg', body: WIDE },
  {
    file: `${MEDIA}/large-etroit.jpg`,
    width: 900,
    height: 1125,
    format: 'jpg',
    body: WIDE,
    viewBox: '820 0 1080 1350',
  },
  {
    file: `${MEDIA}/capture.png`,
    width: 1600,
    height: 1000,
    format: 'png',
    body: `<rect width="1600" height="1000" fill="${PAPER}"/>
<rect width="1600" height="80" fill="${INK}"/>
<rect x="0" y="80" width="320" height="920" fill="${MIST}"/>
<rect x="400" y="160" width="720" height="48" fill="${SLATE}"/>
<rect x="400" y="260" width="1120" height="200" fill="${LINE}"/>
<rect x="400" y="640" width="200" height="56" fill="${ACCENT}"/>`,
  },
  {
    file: `${FIXTURES}/sample.jpg`,
    width: 600,
    height: 400,
    format: 'jpg',
    body: `<rect width="600" height="400" fill="${ACCENT}"/>
<rect x="0" y="320" width="600" height="80" fill="${PAPER}"/>`,
  },
  {
    file: `${FIXTURES}/sample.png`,
    width: 300,
    height: 300,
    format: 'png',
    body: `<rect width="300" height="300" fill="${MIST}"/>
<circle cx="150" cy="150" r="60" fill="${CLAY}"/>`,
  },
];
