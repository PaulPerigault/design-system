// Rendu : la scène s'active, n'est pas vide, est cadrée, suit les jetons, le fil de fer est lisible.
// Une capture par moteur, thème et taille, enregistrée dans le dossier de sortie.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import type { Launched } from './browser.ts';
import { openPage, untilEnhanced } from './browser.ts';
import { resolveTokens } from './colors.ts';
import type { TokenColors } from './colors.ts';
import { HOST, IDLE_WAIT_MS, at, brief, info, row } from './model.ts';
import type { Row, Where } from './model.ts';
import { contrast, coverage, dominantHue, hueDistance, hueOf } from './pixels.ts';
import { framingDetail, readMarks, worstMargin } from './marks.ts';
import { decodePng } from './png.ts';

const MIN_COVERED = 0.02;
const MAX_HUE_GAP_DEG = 25;
const MIN_WIRE_CONTRAST = 3;
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

const SPRITES = `${HOST} .pp-milestones__sprites`;

async function enhanceAndShoot(page: Page): Promise<Buffer> {
  await untilEnhanced(page);
  await page.locator(STAGE).scrollIntoViewIfNeeded();
  await page.waitForTimeout(IDLE_WAIT_MS);
  // Le contrôle de fidélité porte sur la 3D (support, rail, anneau) : les badges HTML en sont exclus.
  // CSSOM et non une feuille injectée : la CSP du site refuse les styles non déclarés.
  const sprites = page.locator(SPRITES);
  await sprites.evaluate((layer) => layer.style.setProperty('visibility', 'hidden'));
  const png = await page.locator(STAGE).screenshot();
  await sprites.evaluate((layer) => layer.style.removeProperty('visibility'));
  return png;
}

function framing(where: Where, png: Buffer, tokens: TokenColors): Row {
  const { covered } = coverage(decodePng(png), tokens.bg);
  return row(
    where,
    'rendu non vide',
    covered >= MIN_COVERED,
    `${(covered * 100).toFixed(1)} % des pixels`,
  );
}

/** Cadrage de l'ADR-0013 : l'active et ses deux suivantes entièrement dans le cadre, marge de 6 %. */
async function framed(where: Where, page: Page): Promise<Row> {
  const stage = await page.locator(STAGE).boundingBox();
  const margin = stage ? worstMargin(await readMarks(page), 0, stage) : null;
  const { ok, detail } = framingDetail(margin);
  return row(where, 'cadrage', ok, detail);
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
  const { context, page } = await openPage(engine.browser, base, {
    colorScheme,
    viewport,
    marks: true,
  });
  try {
    const png = await enhanceAndShoot(page);
    writeFileSync(join(outDir, `${engine.name}-${colorScheme}-${viewport}.png`), png);
    const tokens = await resolveTokens(page);
    const first = colorScheme === 'light' && viewport === 'desktop';
    const renderer = first ? [info(where, 'rastériseur', await rendererOf(page))] : [];
    const framing3d = await framed(where, page);
    return [...renderer, framing(where, png, tokens), framing3d, ...fidelity(where, png, tokens)];
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
