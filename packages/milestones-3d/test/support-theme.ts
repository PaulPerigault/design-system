// Sonde de thème qui rejoue ce qu'un moteur réel a calculé, sans DOM.
import { vi } from 'vitest';
import { THEME_TOKENS } from '../src/constants.ts';
import type { ThemeProbe } from '../src/theme.ts';
import type { EngineSample } from './fixtures/samples.ts';

const TOKEN_KEYS = new Map<string, string>([
  [THEME_TOKENS.bg, 'bg'],
  [THEME_TOKENS.fg, 'fg'],
  [THEME_TOKENS.accent, 'accent'],
  [THEME_TOKENS.onAccent, 'on-accent'],
  [THEME_TOKENS.line, 'line'],
  [THEME_TOKENS.muted, 'muted'],
]);

/** Sonde qui rejoue ce qu'un moteur a calculé, sans DOM. */
export function probeFor(sample: EngineSample, scheme: 'light' | 'dark', raw = sample.raw) {
  const dispose = vi.fn();
  const probe: ThemeProbe = {
    color: (token, forced) => sample.tokens[forced ?? scheme][TOKEN_KEYS.get(token) ?? ''] ?? null,
    custom: (name) => raw[name] ?? '',
    dispose,
  };
  return { probe, dispose };
}
