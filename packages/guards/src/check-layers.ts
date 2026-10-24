// Contrôle : une couche n'importe jamais une couche plus haute (tokens ← css ← astro).
import { importsOf } from './layers/imports.ts';
import { layerOfImport, layerOfPath, validateLayers } from './layers/layers.ts';
import { listFiles } from './lib/files.ts';
import { report } from './lib/report.ts';

export const name = 'layers';

export const defaults = {
  layers: [],
  roots: ['.'],
  extensions: ['.ts', '.mjs', '.js', '.astro', '.css'],
};

export const cliOptions = {};

const NO_LAYER = {
  file: 'layers',
  message: "aucun fichier n'appartient à une couche : vérifier layers[].paths",
};

/** @param {string[] | undefined} list @param {string[]} fallback */
const nonEmpty = (list, fallback) => (list && list.length > 0 ? list : fallback);

/** Imports d'un fichier de la couche `from` qui visent une couche plus haute. */
function violationsOf(layers, io, { file, from }) {
  return importsOf(io.readText(file), file)
    .map(({ specifier, line }) => ({ specifier, line, to: layerOfImport(layers, file, specifier) }))
    .filter(({ to }) => to > from)
    .map(({ specifier, line, to }) => ({
      file,
      line,
      message: `la couche « ${layers[from].name} » importe « ${layers[to].name} » (${specifier}), sens refusé`,
    }));
}

/**
 * @param {{ layers?: unknown, roots?: string[], extensions?: string[] }} options
 * @param {import('./lib/io.ts').GuardIo} io
 * @returns {0 | 1}
 */
export function run(options, io) {
  const layers = validateLayers(options.layers);
  const roots = nonEmpty(options.roots, defaults.roots);
  const extensions = nonEmpty(options.extensions, defaults.extensions);
  const files = listFiles(io, roots, { extensions });
  const owned = files
    .map((file) => ({ file, from: layerOfPath(layers, file) }))
    .filter(({ from }) => from >= 0);
  const problems =
    owned.length === 0 ? [NO_LAYER] : owned.flatMap((item) => violationsOf(layers, io, item));
  return report(io, { name, problems, checked: files.length });
}
