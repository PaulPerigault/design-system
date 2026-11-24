// Badges HTML de la scène (ADR-0014) : image chargée, affichée, intacte. Une rotation, un biais,
// une échelle non uniforme, un filtre, une opacité ou un rapport altéré est un échec.
import type { Page } from '@playwright/test';
import { HOST, row } from './model.ts';
import type { Row, Where } from './model.ts';

export const BADGE_WAIT_MS = 3_000;
const RATIO_TOLERANCE = 0.01;
const MATRIX_TOLERANCE = 1e-6;
const SPRITE = `${HOST} .pp-milestones__sprite:not([data-hidden])`;

export interface Network {
  fetched: number[];
  failed: string[];
}

interface Found {
  a: number;
  b: number;
  c: number;
  d: number;
  ratio: number;
  filter: string;
  opacity: string;
}

/** Ce que la personne voit : style calculé et boîte de chaque badge affiché. */
const read = (page: Page): Promise<Found[]> =>
  page.locator(SPRITE).evaluateAll((images) =>
    images.map((node) => {
      const image = node as HTMLImageElement;
      const style = getComputedStyle(image);
      const matrix = style.transform.match(/-?[\d.e-]+/g)?.map(Number) ?? [];
      const [a = 0, b = 0, c = 0, d = 0] = matrix;
      const box = image.getBoundingClientRect();
      const ratio = box.width / box.height / (image.naturalWidth / image.naturalHeight);
      return { a, b, c, d, ratio, filter: style.filter, opacity: style.opacity };
    }),
  );

function faultsOf(found: Found, index: number): string[] {
  const checks: [boolean, string][] = [
    [Math.abs(found.b) + Math.abs(found.c) > MATRIX_TOLERANCE, 'rotation ou biais'],
    [Math.abs(found.a - found.d) > MATRIX_TOLERANCE, 'échelle non uniforme'],
    [found.filter !== 'none' || found.opacity !== '1', 'filtre ou opacité'],
    [Math.abs(found.ratio - 1) > RATIO_TOLERANCE, 'rapport altéré'],
  ];
  return checks.filter(([bad]) => bad).map(([, name]) => `badge ${index} : ${name}`);
}

export async function spriteRows(page: Page, where: Where, net: Network): Promise<Row[]> {
  await page.waitForTimeout(BADGE_WAIT_MS);
  const found = await read(page);
  const faults = found.flatMap(faultsOf);
  const statuses = [...new Set(net.fetched)].join(', ') || 'aucun';
  const loaded = net.fetched.length > 0 && net.fetched.every((status) => status === 200);
  return [
    row(
      where,
      'badge HTML : image chargée',
      loaded,
      `${net.fetched.length} requête(s), ${statuses}`,
    ),
    row(
      where,
      'badge HTML : aucune image en échec',
      net.failed.length === 0,
      net.failed.join(' | ') || 'aucune',
    ),
    row(where, 'badge HTML : visible', found.length > 0, `${found.length} badge(s) affiché(s)`),
    row(
      where,
      'badge HTML : intact, de face',
      faults.length === 0,
      faults.join(' | ') || 'aucune altération',
    ),
  ];
}

/**
 * Capture de la scène sans les badges HTML : la fidélité aux jetons porte sur la 3D seule. Masqués
 * par le CSSOM, non par une feuille injectée (la CSP du site refuse les styles non déclarés).
 */
export async function shootWithoutBadges(page: Page, stage: string): Promise<Buffer> {
  const layer = page.locator(`${HOST} .pp-milestones__sprites`);
  await layer.evaluate((node) => node.style.setProperty('visibility', 'hidden'));
  const png = await page.locator(stage).screenshot();
  await layer.evaluate((node) => node.style.removeProperty('visibility'));
  return png;
}
