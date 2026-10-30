// Données embarquées : quatre fichiers JSON de `data/`, produits par `scripts/build-data.ts`.
// Lecture seule, relative au paquet ; validées au démarrage. Les erreurs ne citent aucun chemin.
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import type { z } from 'zod';
import type { Data } from '../domain/types.ts';
import { DataError } from '../errors.ts';
import { FILE_NAMES, SCHEMAS } from './data-schemas.ts';
import type { DataKey } from './data-schemas.ts';

const DATA_DIR = new URL('../../data/', import.meta.url);
const REBUILD = 'lancer « npm -w @paulperigault/mcp run build:data »';

/** Valide un contenu déjà lu ; lève une erreur sans chemin si la forme est inattendue. */
export function parseData<S extends z.ZodType>(file: string, raw: string, schema: S): z.output<S> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new DataError('data.unreadable', `données embarquées illisibles (${file}) : ${REBUILD}`);
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new DataError('data.invalid', `données embarquées invalides (${file}) : ${REBUILD}`);
  }
  return result.data;
}

function readOne(read: (url: URL) => string, file: string): string {
  try {
    return read(new URL(file, DATA_DIR));
  } catch {
    throw new DataError('data.absent', `données embarquées absentes (${file}) : ${REBUILD}`);
  }
}

const readFile = (url: URL): string => readFileSync(url, 'utf8');

/** Valide chaque jeu ; `source` rend le texte JSON d'un jeu (fichier lu, ou données en mémoire). */
function build(source: (key: DataKey, file: string) => string): Data {
  const at = (key: DataKey): string => source(key, FILE_NAMES[key]);
  return {
    components: parseData(FILE_NAMES.components, at('components'), SCHEMAS.components),
    tokens: parseData(FILE_NAMES.tokens, at('tokens'), SCHEMAS.tokens),
    decisions: parseData(FILE_NAMES.decisions, at('decisions'), SCHEMAS.decisions),
    docs: parseData(FILE_NAMES.docs, at('docs'), SCHEMAS.docs),
  };
}

/** Charge et valide les données. `read` est injecté (tests) ; par défaut, lecture synchrone. */
export function loadData({ read = readFile }: { read?: (url: URL) => string } = {}): Data {
  return build((_key, file) => readOne(read, file));
}

/** Valide des données déjà en mémoire (tests, autres hôtes). */
export function validateData(data: Record<DataKey, unknown>): Data {
  return build((key) => JSON.stringify(data[key]));
}
