import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);

export const readSource = (name: string): string =>
  readFileSync(new URL(`src/tokens/${name}`, root), 'utf8');
export const readGenerated = (name: string): string =>
  readFileSync(new URL(`generated/${name}`, root), 'utf8');

export const DEFAULT_HUE = 270.7;
export const TWELVE_HUES = Array.from({ length: 12 }, (_, index) => index * 30);
