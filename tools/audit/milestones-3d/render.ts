// Rendu : la scène s'active, n'est pas vide, est cadrée, suit les jetons, le fil de fer est lisible.
// Une capture par moteur, thème et taille, enregistrée dans le dossier de sortie.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import type { Launched } from './browser.ts';
import { openPage, untilEnhanced } from './browser.ts';
import { resolveTokens } from './colors.ts';
import type { TokenColors } from './colors.ts';
import { IDLE_WAIT_MS, at, brief, info, row } from './model.ts';
import type { Row, Where } from './model.ts';
import type { Coverage } from './pixels.ts';
import { contrast, coverage, dominantHue, hueDistance, hueOf } from './pixels.ts';
import { decodePng } from './png.ts';

const MIN_COVERED = 0.02;
const MAX_HUE_GAP_DEG = 25;
const MIN_WIRE_CONTRAST = 3;
const CENTER_MIN = 0.25;
const CENTER_MAX = 0.75;
const STAGE = '[data-milestones-demo] .pp-milestones__stage';
const THEMES = ['light', 'dark'] as const;
const SIZES = ['desktop', 'mobile'] as const;

/** Nom du rastériseur WebGL : dit si la mesure est matérielle ou logicielle. */
export async function rendererOf(page: Page): Promise<string> {
  return page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    if (!gl) return 'aucun';
    return String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  });
}

async function enhanceAndShoot(page: Page): Promise<Buffer> {
  await page.locator(STAGE).scrollIntoViewIfNeeded();
  await untilEnhanced(page);
  await page.waitForTimeout(IDLE_WAIT_MS);
  return page.locator(STAGE).screenshot();
}

/** Centre horizontal de la boîte occupée (0 à 1) et bords gauche et droit touchés ou non. */
function placement(box: Coverage['box'], width: number): { middle: number; clipped: boolean } {
  if (box === null) return { middle: 0, clipped: false };
  return {
    middle: (box.left + box.right) / 2 / width,
    clipped: box.left === 0 || box.right === width - 1,
  };
}

function framing(where: Where, png: Buffer, tokens: TokenColors): Row[] {
  const image = decodePng(png);
  const { covered, box } = coverage(image, tokens.bg);
  const { middle, clipped } = placement(box, image.width);
  const centered = box !== null && middle > CENTER_MIN && middle < CENTER_MAX && !clipped;
  const detail = `centre ${(middle * 100).toFixed(0)} %, bords ${clipped ? 'touchés' : 'libres'}`;
  return [
    row(
      where,
      'rendu non vide',
      covered >= MIN_COVERED,
      `${(covered * 100).toFixed(1)} % des pixels`,
    ),
    row(where, 'cadrage', centered, box ? detail : 'rien'),
  ];
}

function fidelity(where: Where, png: Buffer, tokens: TokenColors): Row[] {
  const hue = dominantHue(decodePng(png), tokens.bg);
  const accent = hueOf(tokens.accent).hue;
  const wire = contrast(tokens.muted, tokens.bg);
  return [
    row(
      where,
      'fidélité aux jetons',
      hue !== null && hueDistance(hue, accent) <= MAX_HUE_GAP_DEG,
      `teinte ${hue ?? '?'}° pour accent ${accent.toFixed(0)}°`,
    ),
    row(
      where,
      'fil de fer lisible',
      wire >= MIN_WIRE_CONTRAST,
      `contraste muted/fond ${wire.toFixed(2)}:1 (1.4.11 : 3:1)`,
    ),
  ];
}

async function one(
  engine: Launched,
  base: string,
  outDir: string,
  scenario: Where & { colorScheme: 'light' | 'dark'; viewport: 'desktop' | 'mobile' },
): Promise<Row[]> {
  const { colorScheme, viewport, ...where } = scenario;
  const { context, page } = await openPage(engine.browser, base, { colorScheme, viewport });
  try {
    const png = await enhanceAndShoot(page);
    writeFileSync(join(outDir, `${engine.name}-${colorScheme}-${viewport}.png`), png);
    const tokens = await resolveTokens(page);
    const first = colorScheme === 'light' && viewport === 'desktop';
    const renderer = first ? [info(where, 'rastériseur', await rendererOf(page))] : [];
    return [...renderer, ...framing(where, png, tokens), ...fidelity(where, png, tokens)];
  } catch (error) {
    return [row(where, 'activation de la 3D', false, brief(error))];
  } finally {
    await context.close();
  }
}

export async function auditRender(engine: Launched, base: string, outDir: string): Promise<Row[]> {
  mkdirSync(outDir, { recursive: true });
  const rows: Row[] = [];
  for (const colorScheme of THEMES) {
    for (const viewport of SIZES) {
      const where = at(engine.name, `${colorScheme}, ${viewport}`);
      rows.push(...(await one(engine, base, outDir, { ...where, colorScheme, viewport })));
    }
  }
  return rows;
}
