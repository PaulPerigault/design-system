// Configuration des couches et résolution d'un import vers sa couche.
import { posix } from 'node:path';
import { normalizePath } from '../lib/paths.ts';
import { GuardUsageError } from '../lib/report.ts';

const RELATIVE = /^\.\.?(\/|$)/;
const SCOPED_SEGMENTS = 2;

/** @param {unknown} list */
const isStrings = (list) => Array.isArray(list) && list.every((item) => typeof item === 'string');

/**
 * @param {unknown} layer
 * @param {number} index
 */
function checkLayer(layer, index) {
  const label = `layers[${index}]`;
  if (typeof layer !== 'object' || layer === null) {
    throw new GuardUsageError(`${label} doit être un objet { name, paths }`);
  }
  if (typeof layer.name !== 'string' || layer.name === '') {
    throw new GuardUsageError(`${label}.name est requis`);
  }
  checkLists(layer, label);
}

/** @param {{ name: string, paths?: unknown, packages?: unknown }} layer @param {string} label */
function checkLists(layer, label) {
  if (!isStrings(layer.paths) || layer.paths.length === 0) {
    throw new GuardUsageError(`${label} (${layer.name}) : paths est requis, non vide`);
  }
  if (layer.packages !== undefined && !isStrings(layer.packages)) {
    throw new GuardUsageError(`${label} (${layer.name}) : packages doit être une liste de noms`);
  }
}

/**
 * Valide `layers` (du plus bas au plus haut) et normalise les chemins.
 * @param {unknown} layers
 * @returns {{ name: string, paths: string[], packages: string[] }[]}
 */
export function validateLayers(layers) {
  if (!Array.isArray(layers) || layers.length === 0) {
    throw new GuardUsageError(
      'layers est requis : liste non vide, de la plus basse à la plus haute',
    );
  }
  layers.forEach(checkLayer);
  const names = layers.map((layer) => layer.name);
  const duplicate = names.find((layerName, i) => names.indexOf(layerName) !== i);
  if (duplicate !== undefined) throw new GuardUsageError(`couche en double : ${duplicate}`);
  return layers.map((layer) => ({
    name: layer.name,
    paths: layer.paths.map(normalizePath),
    packages: layer.packages ?? [],
  }));
}

/** @param {string} path */
const segmentsOf = (path) => normalizePath(path).split('/').filter(Boolean);

/** Vrai si les segments de `prefix` ouvrent ceux de `path`. */
function startsWithSegments(path, prefix) {
  const head = segmentsOf(prefix);
  const all = segmentsOf(path);
  return head.length > 0 && head.every((segment, i) => all[i] === segment);
}

/**
 * Indice de la couche qui contient `path`, ou -1.
 * @param {{ paths: string[] }[]} layers
 * @param {string} path
 * @returns {number}
 */
export function layerOfPath(layers, path) {
  return layers.findIndex((layer) => layer.paths.some((entry) => startsWithSegments(path, entry)));
}

/** `@scope/nom/x` devient `@scope/nom`, `nom/x` devient `nom`. */
function packageName(specifier) {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, SCOPED_SEGMENTS).join('/') : parts[0];
}

/**
 * Indice de la couche visée par un import, ou -1 si la cible est hors couche.
 * @param {{ paths: string[], packages: string[] }[]} layers
 * @param {string} file fichier importeur
 * @param {string} specifier
 * @returns {number}
 */
export function layerOfImport(layers, file, specifier) {
  if (RELATIVE.test(specifier)) {
    return layerOfPath(layers, posix.join(posix.dirname(normalizePath(file)), specifier));
  }
  const pkg = packageName(specifier);
  return layers.findIndex((layer) => layer.packages.includes(pkg));
}
