import type { Locator, Page } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PATH = '/components/milestones-3d/';
const ASSETS = fileURLToPath(new URL('../dist/_astro/', import.meta.url));
/** Le .wasm est dans le build seulement si la construction l'avait (jamais commité). */
export const hasWasm = (): boolean =>
  existsSync(ASSETS) &&
  readdirSync(ASSETS).some((file) => file.startsWith('pp_milestones') && file.endsWith('.wasm'));

/**
 * Avertissement du rastériseur logiciel de Chromium headless : un canvas WebGL2 qui ne fait que
 * `clear` l'émet aussi (vérifié hors de la page). Il ne vient pas de la scène.
 */
export const SOFTWARE_GL_NOISE = /GL Driver Message .*GPU stall due to ReadPixels/;

export const enhanced = (page: Page): Locator =>
  page.locator('[data-milestones-demo] .pp-milestones[data-state="enhanced"]');
