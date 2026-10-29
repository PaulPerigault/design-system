// Données embarquées : quatre fichiers JSON de `data/`, produits par `scripts/build-data.ts`.
// Lecture seule, relative au paquet ; validées au démarrage. Les erreurs ne citent aucun chemin.
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { z } from 'zod';

const DATA_DIR = new URL('../data/', import.meta.url);
const REBUILD = 'lancer « npm -w @paulperigault/mcp run build:data »';

const text = z.string();
const list = z.array(z.string());

const component = z.object({
  slug: text,
  title: text,
  group: text,
  summary: text,
  use: list,
  avoid: list,
  snippet: text,
  a11y: z.object({ keyboard: list, screenReader: list, guaranteed: list, integrator: list }),
  props: z.array(z.object({ name: text, type: text, fallback: text, description: text })),
  tokens: list,
  evidence: list,
});

const colorValue = z.object({ oklch: text, hex: text });
const themeTokens = z.record(text, colorValue);

const tokens = z.object({
  themes: z.object({ light: themeTokens, dark: themeTokens }),
  base: z.record(text, text),
  pairs: z.array(z.object({ fg: text, bg: text, min: z.number(), norm: text })),
});

const decisions = z.object({
  adrs: z.array(z.object({ id: text, title: text, text })),
  decisions: z.array(
    z.object({ id: text, date: text, decision: text, alternative: text, rollback: text }),
  ),
});

const docs = z.array(z.object({ path: text, title: text, url: text, body: text }));

const SCHEMAS = {
  components: z.array(component),
  tokens,
  decisions,
  docs,
};
const FILE_NAMES = {
  components: 'components.json',
  tokens: 'tokens.json',
  decisions: 'adr.json',
  docs: 'docs.json',
};

export type Component = z.infer<typeof component>;
export type Tokens = z.infer<typeof tokens>;
export type Decisions = z.infer<typeof decisions>;
export type Docs = z.infer<typeof docs>;
export type Data = { [K in keyof typeof SCHEMAS]: z.output<(typeof SCHEMAS)[K]> };

/** Valide un contenu déjà lu ; lève une erreur sans chemin si la forme est inattendue. */
export function parseData<S extends z.ZodType>(file: string, raw: string, schema: S): z.output<S> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`données embarquées illisibles (${file}) : ${REBUILD}`);
  }
  const result = schema.safeParse(json);
  if (!result.success) throw new Error(`données embarquées invalides (${file}) : ${REBUILD}`);
  return result.data;
}

function readOne(read: (url: URL) => string, file: string): string {
  try {
    return read(new URL(file, DATA_DIR));
  } catch {
    throw new Error(`données embarquées absentes (${file}) : ${REBUILD}`);
  }
}

const readFile = (url: URL): string => readFileSync(url, 'utf8');

type Key = keyof typeof SCHEMAS;

/** Valide chaque jeu ; `source` rend le texte JSON d'un jeu (fichier lu, ou données en mémoire). */
function build(source: (key: Key, file: string) => string): Data {
  const at = (key: Key): string => source(key, FILE_NAMES[key]);
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
export function validateData(data: Record<Key, unknown>): Data {
  return build((key) => JSON.stringify(data[key]));
}
