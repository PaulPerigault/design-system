/**
 * Tri chronologique de Milestones3D (ADR-0013, décision 1). Les jalons sont triés par date
 * croissante ; le tri est stable. Un jalon sans date (ou à la date illisible) garde sa place
 * derrière le jalon qui le précède dans l'ordre fourni : il suit son prédécesseur au lieu d'être
 * rejeté en fin de liste. Les jalons sans date placés avant tout jalon daté restent en tête.
 */
import type { MilestoneItem } from './milestones-3d-model';

const DATE = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/;
const NONE = '';

const MONTH_OFFSET = 1;

/** Le mois et le jour existent-ils (31 avril, 30 février : non) ? */
function real(year: number, month: number, day: number): boolean {
  const parsed = new Date(Date.UTC(year, month - MONTH_OFFSET, day));
  return parsed.getUTCMonth() === month - MONTH_OFFSET;
}

/** Clé comparable : `AAAA-MM-JJ`, le jour valant `00` quand il manque ; vide si illisible. */
export function sortKey(date: string | undefined): string {
  const match = date === undefined ? null : DATE.exec(date);
  if (!match) return NONE;
  const [year, month, day] = [Number(match[1]), Number(match[2]), match[3]];
  return real(year, month, Number(day ?? MONTH_OFFSET))
    ? `${match[1]}-${match[2]}-${day ?? '00'}`
    : NONE;
}

/** Un jalon daté (ou le début de liste) suivi des jalons sans date qui le suivent. */
interface Chunk {
  key: string;
  items: MilestoneItem[];
}

function chunks(milestones: readonly MilestoneItem[]): Chunk[] {
  const out: Chunk[] = [{ key: NONE, items: [] }];
  for (const item of milestones) {
    const key = sortKey(item.date);
    if (key === NONE) out[out.length - 1]?.items.push(item);
    else out.push({ key, items: [item] });
  }
  return out;
}

/** Copie triée, sans modifier l'entrée. */
export function sortMilestones(milestones: readonly MilestoneItem[]): MilestoneItem[] {
  const [head, ...rest] = chunks(milestones);
  const sorted = [...rest].sort((a, b) => a.key.localeCompare(b.key));
  return [head, ...sorted].flatMap((chunk) => chunk?.items ?? []);
}
