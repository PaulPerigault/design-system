// Règle de dépendance vers l'intérieur (ADR-0006, décision 1) : les anneaux sont listés du plus
// interne au plus externe (domain, application, infrastructure) ; un import ne va jamais vers un
// anneau plus externe, et seul l'anneau le plus externe touche les modules d'exécution.
import { posix } from 'node:path';
import { normalizePath } from '../paths.ts';

export interface RingConfig {
  /** Racines de sources (`packages/x/src`) dont les sous-dossiers directs sont les anneaux. */
  roots: string[];
  /** Noms de dossier, du plus interne au plus externe. */
  rings: string[];
  /** Modules `node:*` sans entrée-sortie, permis dans les anneaux internes. */
  pureNode: string[];
  /** Paquets externes permis dans les anneaux internes. */
  allowPackages: string[];
}

export interface ImportRef {
  specifier: string;
  typeOnly: boolean;
}

const RELATIVE = /^\.\.?(\/|$)/;
const NODE_PREFIX = 'node:';
/** Un vrai spécificateur : un extrait de commentaire ou de gabarit (`<x>`, `${x}`) n'en est pas un. */
const SPECIFIER = /^[\w@./:~-]+$/;

/** Indice de l'anneau d'un fichier, ou -1 hors des racines et hors des anneaux. */
export function ringOf({ roots, rings }: Pick<RingConfig, 'roots' | 'rings'>, path: string) {
  const file = normalizePath(path);
  const root = roots.map(normalizePath).find((entry) => file.startsWith(`${entry}/`));
  if (root === undefined) return -1;
  const [first = ''] = file.slice(root.length + 1).split('/');
  return rings.indexOf(first);
}

const nameOf = (config: RingConfig, index: number): string => config.rings[index] ?? '?';

function relativeViolation(config: RingConfig, file: string, ref: ImportRef): string | null {
  const from = ringOf(config, file);
  const target = posix.join(posix.dirname(normalizePath(file)), ref.specifier);
  const to = ringOf(config, target);
  if (to <= from) return null;
  return `l'anneau « ${nameOf(config, from)} » importe « ${nameOf(config, to)} » (${ref.specifier}), sens refusé`;
}

const isAllowed = (list: string[], specifier: string): boolean =>
  list.some((entry) => specifier === entry || specifier.startsWith(`${entry}/`));

function externalViolation(config: RingConfig, file: string, ref: ImportRef): string | null {
  const from = ringOf(config, file);
  const outer = config.rings.length - 1;
  if (from >= outer || ref.typeOnly) return null;
  const { specifier } = ref;
  const permitted = specifier.startsWith(NODE_PREFIX) ? config.pureNode : config.allowPackages;
  if (isAllowed(permitted, specifier)) return null;
  return `l'anneau « ${nameOf(config, from)} » importe « ${specifier} » : réservé à « ${nameOf(config, outer)} »`;
}

/** Message de violation d'un import, ou `null` s'il respecte la règle. */
export function ringViolation(config: RingConfig, file: string, ref: ImportRef): string | null {
  if (ringOf(config, file) < 0 || !SPECIFIER.test(ref.specifier)) return null;
  return RELATIVE.test(ref.specifier)
    ? relativeViolation(config, file, ref)
    : externalViolation(config, file, ref);
}
