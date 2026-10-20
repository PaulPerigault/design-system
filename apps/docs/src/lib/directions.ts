import { inSrgbGamut, toHex } from '@paulperigault/tokens/color';
import type { Oklch } from '@paulperigault/tokens/color';
import { contrastRatio } from '@paulperigault/tokens/contrast';
import blueprint from '../../../../packages/tokens/src/directions/blueprint.tokens.json';
import encre from '../../../../packages/tokens/src/directions/encre.tokens.json';
import runbook from '../../../../packages/tokens/src/directions/runbook.tokens.json';
import signal from '../../../../packages/tokens/src/directions/signal.tokens.json';

export const ROLES = ['bg', 'fg', 'muted', 'accent'] as const;
export const THEMES = ['light', 'dark'] as const;

export type Role = (typeof ROLES)[number];
export type Theme = (typeof THEMES)[number];

interface RawColor {
  $value: { components: number[] };
}
type RawTheme = Record<Role, RawColor>;
interface RawDirection extends Record<Theme, RawTheme> {
  $description: string;
}

export interface ThemeReport {
  /** Hex par rôle ; `null` si la couleur sort du gamut sRGB. */
  hex: Record<Role, string | null>;
  /** Rapports WCAG 2 ; `null` si une des deux couleurs sort du gamut. */
  ratios: { fgBg: number | null; mutedBg: number | null; accentBg: number | null };
  inGamut: boolean;
}

export interface DirectionReport {
  id: string;
  name: string;
  description: string;
  retained: boolean;
  themes: Record<Theme, ThemeReport>;
}

const SOURCES: { id: string; name: string; raw: RawDirection }[] = [
  { id: 'encre', name: 'Encre', raw: encre as RawDirection },
  { id: 'blueprint', name: 'Blueprint', raw: blueprint as RawDirection },
  { id: 'runbook', name: 'Runbook', raw: runbook as RawDirection },
  { id: 'signal', name: 'Signal', raw: signal as RawDirection },
];

const RETAINED_ID = 'encre';

const toOklch = ({ $value }: RawColor): Oklch => {
  const [l = 0, c = 0, h = 0] = $value.components;
  return { l, c, h };
};

const ratio = (a: Oklch, b: Oklch, ok: boolean): number | null => (ok ? contrastRatio(a, b) : null);

function reportTheme(raw: RawTheme): ThemeReport {
  const colors = Object.fromEntries(ROLES.map((role) => [role, toOklch(raw[role])])) as Record<
    Role,
    Oklch
  >;
  const inside = Object.fromEntries(
    ROLES.map((role) => [role, inSrgbGamut(colors[role])]),
  ) as Record<Role, boolean>;
  const hex = Object.fromEntries(
    ROLES.map((role) => [role, inside[role] ? toHex(colors[role]) : null]),
  ) as Record<Role, string | null>;
  const pair = (role: Role) => ratio(colors[role], colors.bg, inside[role] && inside.bg);
  return {
    hex,
    ratios: { fgBg: pair('fg'), mutedBg: pair('muted'), accentBg: pair('accent') },
    inGamut: ROLES.every((role) => inside[role]),
  };
}

export function loadDirections(): DirectionReport[] {
  return SOURCES.map(({ id, name, raw }) => ({
    id,
    name,
    description: raw.$description,
    retained: id === RETAINED_ID,
    themes: { light: reportTheme(raw.light), dark: reportTheme(raw.dark) },
  }));
}
