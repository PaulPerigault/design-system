// Configuration des couches et résolution d'un import vers sa couche.
import { posix } from 'node:path';
import { normalizePath } from '../lib/paths.ts';
import { GuardUsageError } from '../lib/report.ts';

const RELATIVE = /^\.\.?(\/|$)/;
const SCOPED_SEGMENTS = 2;

const isStrings = (list: unknown): list is string[] =>
  Array.isArray(list) && list.every((item) => typeof item === 'string');

function checkLayer(layer: unknown, index: number) {
  const label = `layers[${index}]`;
  if (typeof layer !== 'object' || layer === null) {
    throw new GuardUsageError(`${label} doit être un objet { name, paths }`);
  }
  const obj = layer as { name?: unknown; paths?: unknown; packages?: unknown };
  if (typeof obj.name !== 'string' || obj.name === '') {
    throw new GuardUsageError(`${label}.name est requis`);
  }
  checkLists(obj as { name: string; paths?: unknown; packages?: unknown }, label);
}

function checkLists(layer: { name: string; paths?: unknown; packages?: unknown }, label: string) {
  if (!isStrings(layer.paths) || layer.paths.length === 0) {
    throw new GuardUsageError(`${label} (${layer.name}) : paths est requis, non vide`);
  }
  if (layer.packages !== undefined && !isStrings(layer.packages)) {
    throw new GuardUsageError(`${label} (${layer.name}) : packages doit être une liste de noms`);
  }
}

export interface Layer {
  name: string;
  paths: string[];
  packages: string[];
}

export function validateLayers(layers: unknown): Layer[] {
  if (!Array.isArray(layers) || layers.length === 0) {
    throw new GuardUsageError(
      'layers est requis : liste non vide, de la plus basse à la plus haute',
    );
  }
  layers.forEach(checkLayer);
  const names = layers.map((layer) => layer.name);
  const duplicate = names.find((layerName, i) => names.indexOf(layerName) !== i);
  if (duplicate !== undefined) throw new GuardUsageError(`couche en double : ${duplicate}`);
  return layers.map((layer: { name: string; paths: unknown[]; packages?: unknown[] }) => ({
    name: layer.name,
    paths: layer.paths.map((p) => normalizePath(p !== undefined ? String(p) : '')),
    packages: (layer.packages ?? []) as string[],
  }));
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
  return specifier.startsWith('@') ? parts.slice(0, SCOPED_SEGMENTS).join('/') : parts[0];
}

export function layerOfImport(layers: { paths: string[]; packages: string[] }[], file: string, specifier: string): number {
  if (RELATIVE.test(specifier)) {
    return layerOfPath(layers, posix.join(posix.dirname(normalizePath(file)), specifier));
  }
  const pkg = packageName(specifier) ?? '';
  return layers.findIndex((layer) => layer.packages.includes(pkg));
}
