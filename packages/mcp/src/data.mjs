// Données embarquées : quatre fichiers JSON de `data/`, produits par `scripts/build-data.mjs`.
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

const FILES = Object.freeze({
  components: { file: 'components.json', schema: z.array(component) },
  tokens: { file: 'tokens.json', schema: tokens },
  decisions: { file: 'adr.json', schema: decisions },
  docs: { file: 'docs.json', schema: docs },
});

/** Valide un contenu déjà lu ; lève une erreur sans chemin si la forme est inattendue. */
export function parseData(file, raw, schema) {
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`données embarquées illisibles (${file}) : ${REBUILD}`);
  }
  const result = schema.safeParse(json);
  if (!result.success) throw new Error(`données embarquées invalides (${file}) : ${REBUILD}`);
  return result.data;
}

function readOne(read, file) {
  try {
    return read(new URL(file, DATA_DIR));
  } catch {
    throw new Error(`données embarquées absentes (${file}) : ${REBUILD}`);
  }
}

/**
 * Charge et valide les données. `read` est injecté (tests) ; par défaut, lecture synchrone.
 * @param {{ read?: (url: URL) => string }} [io]
 * @returns {{ components: object[], tokens: object, decisions: object, docs: object[] }}
 */
export function loadData({ read = (url) => readFileSync(url, 'utf8') } = {}) {
  return Object.fromEntries(
    Object.entries(FILES).map(([key, { file, schema }]) => [
      key,
      parseData(file, readOne(read, file), schema),
    ]),
  );
}

/** Valide des données déjà en mémoire (tests, autres hôtes). */
export function validateData(data) {
  return Object.fromEntries(
    Object.entries(FILES).map(([key, { file, schema }]) => [
      key,
      parseData(file, JSON.stringify(data[key]), schema),
    ]),
  );
}
