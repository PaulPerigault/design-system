import type { InitOptions, Theme } from '../src/types.ts';
import { createInstance } from '../src/init.ts';
import { createHarness } from './support.ts';
import type { Harness } from './support.ts';

export const theme: Theme = {
  colors: {
    bg: { space: 'oklch', l: 0.985, c: 0.004, h: 270.7 },
    fg: { space: 'oklch', l: 0.215, c: 0.016, h: 270.7 },
    accent: { space: 'oklch', l: 0.47, c: 0.19, h: 270.7 },
    onAccent: { space: 'oklch', l: 0.995, c: 0.002, h: 270.7 },
    line: { space: 'oklch', l: 0.885, c: 0.01, h: 270.7 },
    muted: { space: 'oklch', l: 0.43, c: 0.022, h: 270.7 },
  },
  durationBase: 160,
  durationFast: 100,
  easing: [0.2, 0, 0, 1],
};
export const data = {
  milestones: [
    { id: 'a', label: 'A', status: 'achieved', emblem: 'key' },
    { id: 'b', label: 'B', status: 'planned' },
  ],
  goal: { label: 'But' },
};

export async function start(options: InitOptions = {}, patch?: (h: Harness) => void) {
  const h = createHarness(theme);
  patch?.(h);
  const handle = await createInstance(h.canvas, data, theme, { options, env: h.env });
  return { h, handle };
}
