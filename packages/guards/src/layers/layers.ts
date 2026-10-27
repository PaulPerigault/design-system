// Configuration des couches et résolution d'un import vers sa couche.
import { posix } from 'node:path';
import { isRecord, isStrings } from '../lib/options.ts';
import { normalizePath } from '../lib/paths.ts';
import { GuardUsageError } from '../lib/report.ts';

const RELATIVE = /^\.\.?(\/|$)/;
const SCOPED_SEGMENTS = 2;

export interface Layer {
  name: string;
  paths: string[];
  packages: string[];
}

function packagesOf(value: unknown, label: string, name: string): string[] {
  if (value === undefined) return [];
  if (isStrings(value)) return value;
  throw new GuardUsageError(`${label} (${name}) : packages doit être une liste de noms`);
}

function parseLayer(layer: unknown, index: number): Layer {
  const label = `layers[${index}]`;
  if (!isRecord(layer)) throw new GuardUsageError(`${label} doit être un objet { name, paths }`);
  const { name, paths, packages } = layer;
  if (typeof name !== 'string' || name === '') {
    throw new GuardUsageError(`${label}.name est requis`);
  }
  if (!isStrings(paths) || paths.length === 0) {
    throw new GuardUsageError(`${label} (${name}) : paths est requis, non vide`);
  }
  return { name, paths: paths.map(normalizePath), packages: packagesOf(packages, label, name) };
}

export function validateLayers(layers: unknown): Layer[] {
  if (!Array.isArray(layers) || layers.length === 0) {
    throw new GuardUsageError(
      'layers est requis : liste non vide, de la plus basse à la plus haute',
    );
  }
  const parsed = layers.map(parseLayer);
  const names = parsed.map((layer) => layer.name);
  const duplicate = names.find((layerName, i) => names.indexOf(layerName) !== i);
  if (duplicate !== undefined) throw new GuardUsageError(`couche en double : ${duplicate}`);
  return parsed;
}

const segmentsOf = (path: string): string[] => normalizePath(path).split('/').filter(Boolean);

/** Vrai si les segments de `prefix` ouvrent ceux de `path`. */
function startsWithSegments(path: string, prefix: string): boolean {
  const head = segmentsOf(prefix);
  const all = segmentsOf(path);
  return head.length > 0 && head.every((segment, i) => all[i] === segment);
}

export function layerOfPath(layers: { paths: string[] }[], path: string): number {
  return layers.findIndex((layer) => layer.paths.some((entry) => startsWithSegments(path, entry)));
}

/** `@scope/nom/x` devient `@scope/nom`, `nom/x` devient `nom`. */
function packageName(specifier: string): string {
  const parts = specifier.split('/');
  const first = parts[0];
  if (first === undefined) return '';
  return specifier.startsWith('@') ? parts.slice(0, SCOPED_SEGMENTS).join('/') : first;
}

export function layerOfImport(
  layers: { paths: string[]; packages: string[] }[],
  file: string,
  specifier: string,
): number {
  if (RELATIVE.test(specifier)) {
    return layerOfPath(layers, posix.join(posix.dirname(normalizePath(file)), specifier));
  }
  const pkg = packageName(specifier) ?? '';
  return layers.findIndex((layer) => layer.packages.includes(pkg));
}
