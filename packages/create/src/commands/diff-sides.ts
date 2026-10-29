import { sha256 } from '../lib/hash.ts';
import type { LockFile } from '../lib/lock.ts';

export interface Side {
  lock?: LockFile;
  copy?: string | undefined;
  pkg?: string | undefined;
}

/** Origines d'une modification : `local` (copie) et/ou `paquet` (amont) par rapport au verrou. */
function causes({ lock, copy, pkg }: Side): string[] {
  if (!lock) return [];
  const candidates: [string, string | undefined][] = [
    ['local', copy],
    ['paquet', pkg],
  ];
  return candidates
    .filter(([, text]) => sha256(text ?? '') !== lock.sha256)
    .map(([label]) => label);
}

/** Libellé de la différence d'un fichier, ou `null` s'il est identique. */
function classify(side: Side): string | null {
  const { lock, copy, pkg } = side;
  if (pkg === undefined) return lock === undefined ? null : 'supprimé';
  if (copy === undefined) return 'ajouté';
  if (copy === pkg) return null;
  const found = causes(side);
  return found.length > 0 ? `modifié (${found.join(', ')})` : 'modifié';
}

/** Lignes `<statut> <source>`, triées par source. */
export function differences(sides: Map<string, Side>): string[] {
  return [...sides.keys()].sort().flatMap((key) => {
    const label = classify(sides.get(key) ?? {});
    return label === null ? [] : [`${label} ${key}`];
  });
}
