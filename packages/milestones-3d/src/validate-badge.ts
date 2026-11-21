// Badge d'un jalon : image du même site, jamais un schéma exécutable. Un jalon planifié n'en porte
// pas (ADR-0013) : jamais d'image qui suggère un niveau non obtenu.
import { MilestonesError } from './error.ts';
import { isDimension, isHref } from './fields.ts';
import type { Badge, Status } from './types.ts';
import { isRecord, text } from './validate-text.ts';
import type { Rec } from './validate-text.ts';

function dimension(source: Rec, key: 'width' | 'height', where: string): number | undefined {
  const value = source[key];
  if (value === undefined) return undefined;
  if (!isDimension(value)) throw new MilestonesError('invalid-badge', `${where}.${key}`);
  return value;
}

/** Valide `milestone.badge` ; `undefined` si le jalon n'en porte pas. */
export function badgeOf(raw: Rec, status: Status, where: string): Badge | undefined {
  const value = raw['badge'];
  const here = `${where}.badge`;
  if (value === undefined) return undefined;
  if (status === 'planned') throw new MilestonesError('planned-badge', here);
  if (!isRecord(value)) throw new MilestonesError('invalid-badge', here);
  const src = text(value, 'src', here);
  if (!isHref(src)) throw new MilestonesError('invalid-badge', `${here}.src`);
  const width = dimension(value, 'width', here);
  const height = dimension(value, 'height', here);
  return {
    src,
    ...(width === undefined ? {} : { width }),
    ...(height === undefined ? {} : { height }),
  };
}
