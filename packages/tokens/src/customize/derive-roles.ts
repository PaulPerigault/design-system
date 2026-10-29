import type { Oklch } from '../lib/color.ts';
import { formatOklch, parseOklch } from '../lib/color.ts';
import { contrastRatio } from '../lib/contrast.ts';
import { fitToGamut } from '../palette/domain/color/gamut.ts';
import { MIN_GRAPHIC_CONTRAST, MIN_TEXT_CONTRAST } from '../palette/domain/thresholds.ts';
import type { TokenMap } from '../palette/domain/tokens.ts';
import type { Theme, ThemeBase } from '../palette/domain/types.ts';
import type { Result } from './result.ts';
import { fail, ok } from './result.ts';
import { settle } from './settle.ts';

/** Rôles qui portent la teinte d'accent, et surface contre laquelle ils sont mesurés. */
export interface RoleBase {
  readonly focus: Oklch;
  readonly running: Oklch;
  readonly surface: Oklch;
}

export type ThemeSource = ThemeBase & RoleBase;

const RATIO_DIGITS = 2;

/** Seuils de `roles.json` : anneau de focus 1.4.11 (3:1), statut en texte 1.4.3 (4,5:1). */
const ROLES = [
  { token: '--pp-color-focus', key: 'focus', min: MIN_GRAPHIC_CONTRAST },
  { token: '--pp-color-status-running', key: 'running', min: MIN_TEXT_CONTRAST },
] as const;

function measure(token: string, color: Oklch, min: number, grounds: [string, Oklch][]): string[] {
  return grounds
    .map(([name, ground]) => [name, contrastRatio(color, ground)] as const)
    .filter(([, ratio]) => ratio < min)
    .map(([name, ratio]) => `${token} à ${ratio.toFixed(RATIO_DIGITS)}:1 sur ${name}, ${min}:1`);
}

/**
 * Dérive focus et statut « en cours » : clarté et chroma des jetons, teinte de l'accent (déjà
 * normalisée par la dérivation des palettes). Le contraste est mesuré sur la valeur émise.
 */
export function deriveRoles(hue: number, theme: Theme, source: ThemeSource): Result<TokenMap> {
  const tokens: Record<string, string> = {};
  const failures: string[] = [];
  const grounds: [string, Oklch][] = [
    ['le fond', source.bg],
    ['la surface', source.surface],
  ];
  for (const { token, key, min } of ROLES) {
    const value = settle(formatOklch(fitToGamut({ ...source[key], h: hue })));
    tokens[token] = value;
    failures.push(...measure(token, parseOklch(value), min, grounds));
  }
  if (failures.length === 0) return ok(tokens);
  return fail(
    'build.role-contrast-failed',
    `Teinte ${hue}, thème ${theme} : ${failures.join(' ; ')} exigé.`,
  );
}
