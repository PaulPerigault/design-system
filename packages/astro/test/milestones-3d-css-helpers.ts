import { readFileSync } from 'node:fs';

export const read = (name: string): string =>
  readFileSync(new URL(`../../css/src/${name}`, import.meta.url), 'utf8');
export const tokens = JSON.parse(
  readFileSync(new URL('../../tokens/generated/tokens.json', import.meta.url), 'utf8'),
) as { base: object; themes: Record<string, object> };
export const known = new Set([
  ...Object.keys(tokens.base),
  ...Object.values(tokens.themes).flatMap((theme) => Object.keys(theme)),
]);
export const strip = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

export const FILES = [
  'milestones-3d.css',
  'milestones-3d-badge.css',
  'milestones-3d-enhanced.css',
  'milestones-3d-panel.css',
  'milestones-3d-steps.css',
  'milestones-3d-reserve.css',
];
