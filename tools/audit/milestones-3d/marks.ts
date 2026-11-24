// Positions écran des médailles : le `project()` de la scène (x, y de 0 à 1 depuis le haut, rayon
// rapporté à la hauteur, visibilité) relevé dans la page, et contrôle pur du cadrage de l'ADR-0013
// (l'active et, hors format compact, ses deux suivantes entièrement dans le cadre, marge de 6 %).
import type { Page } from '@playwright/test';

export interface Mark {
  x: number;
  y: number;
  scale: number;
  visible: boolean;
}

export const MARGIN = 0.06;
export const AHEAD = 2;
/** Canevas compact (téléphone) : seule l'active est cadrée (ADR-0014, `setCompact`). */
export const COMPACT_MAX_PX = 480;
const STRIDE = 4;

/**
 * Le tableau de `project()` sort du `.wasm` par `Float32Array.slice()` (glue wasm-bindgen) : la page
 * d'audit le copie dans `window.__marks`. Instrument de test seul, posé avant tout script.
 */
export const MARKS_SCRIPT = `
  const slice = Float32Array.prototype.slice;
  Float32Array.prototype.slice = function (...args) {
    const out = slice.apply(this, args);
    if (args.length === 0 && out.length >= 4 && out.length % 4 === 0) window.__marks = Array.from(out);
    return out;
  };
`;

export function parseMarks(values: readonly number[]): Mark[] {
  const marks: Mark[] = [];
  for (let at = 0; at + STRIDE <= values.length; at += STRIDE) {
    const [x = 0, y = 0, scale = 0, visible = 0] = values.slice(at, at + STRIDE);
    marks.push({ x, y, scale, visible: visible === 1 });
  }
  return marks;
}

export async function readMarks(page: Page): Promise<Mark[]> {
  const values = await page.evaluate(
    () => (window as unknown as { __marks?: number[] }).__marks ?? [],
  );
  return parseMarks(values);
}

export interface Area {
  width: number;
  height: number;
}

/** Marge restante (fraction de la dimension) la plus faible parmi l'active et ses suivantes. */
export function worstMargin(
  marks: readonly Mark[],
  active: number,
  area: Area,
  compact = area.width < COMPACT_MAX_PX,
): number | null {
  const ahead = compact ? 0 : AHEAD;
  const shown = marks.slice(active, active + ahead + 1);
  if (shown.length === 0 || shown.some((mark) => !mark.visible)) return null;
  const margins = shown.flatMap((mark) => {
    const radius = mark.scale * area.height;
    const [x, y] = [mark.x * area.width, mark.y * area.height];
    return [
      (x - radius) / area.width,
      (area.width - x - radius) / area.width,
      (y - radius) / area.height,
      (area.height - y - radius) / area.height,
    ];
  });
  return Math.min(...margins);
}

/** Texte de la cellule : marge la plus faible en pourcentage, ou la raison de l'échec. */
export function framingDetail(margin: number | null): { ok: boolean; detail: string } {
  if (margin === null) return { ok: false, detail: 'une médaille cadrée est invisible ou absente' };
  const detail = `marge la plus faible ${(margin * 100).toFixed(1)} % (minimum ${MARGIN * 100} %)`;
  return { ok: margin >= MARGIN - 1e-3, detail };
}
