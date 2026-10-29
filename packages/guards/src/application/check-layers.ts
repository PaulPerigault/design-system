// Contrôle : une couche n'importe jamais une couche plus haute (tokens ← css ← astro).
import type { GuardIo } from './ports.ts';
import type { Layer } from '../domain/layers/layers.ts';
import { importsOf } from '../domain/layers/imports.ts';
import { layerOfImport, layerOfPath, validateLayers } from '../domain/layers/layers.ts';
import { listFiles } from './files.ts';
import { nonEmptyListOption } from '../domain/options.ts';
import type { Options } from '../domain/options.ts';
import { report } from './report.ts';

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

/** Imports d'un fichier de la couche `from` qui visent une couche plus haute. */
function violationsOf(
  layers: Layer[],
  io: GuardIo,
  { file, from }: { file: string; from: number },
) {
  return importsOf(io.readText(file), file)
    .map(({ specifier, line }) => ({ specifier, line, to: layerOfImport(layers, file, specifier) }))
    .filter(({ to }) => to > from)
    .map(({ specifier, line, to }) => ({
      file,
      line,
      message: `la couche « ${layers[from]?.name} » importe « ${layers[to]?.name} » (${specifier}), sens refusé`,
    }));
}

export function run(options: Options, io: GuardIo): 0 | 1 {
  const layers = validateLayers(options.layers);
  const roots = nonEmptyListOption(options, 'roots', defaults.roots);
  const extensions = nonEmptyListOption(options, 'extensions', defaults.extensions);
  const files = listFiles(io, roots, { extensions });
  const owned = files
    .map((file) => ({ file, from: layerOfPath(layers, file) }))
    .filter(({ from }) => from >= 0);
  const problems: { file: string; line?: number; message: string }[] =
    owned.length === 0 ? [NO_LAYER] : owned.flatMap((item) => violationsOf(layers, io, item));
  return report(io, { name, problems, checked: files.length });
}
