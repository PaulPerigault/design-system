// Schémas zod des quatre fichiers de `data/` : la frontière où la donnée brute devient un type du
// domaine. Un champ de plus ou de moins dans le JSON est refusé ici, jamais plus loin.
import { z } from 'zod';
import type { Data } from '../domain/types.ts';

export type DataKey = keyof Data;

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
    // Les lignes du journal à trois colonnes (D-040, D-041, D-055) n'ont ni alternative ni retour.
    z.object({
      id: text,
      date: text,
      decision: text,
      alternative: text.optional(),
      rollback: text.optional(),
    }),
  ),
});

const docs = z.array(z.object({ path: text, title: text, url: text, body: text }));

/** Un schéma par jeu ; `ZodType<Data[K]>` garantit que la validation produit le type du domaine. */
export const SCHEMAS: { [K in keyof Data]: z.ZodType<Data[K]> } = {
  components: z.array(component),
  tokens,
  decisions,
  docs,
};
export const FILE_NAMES: Record<DataKey, string> = {
  components: 'components.json',
  tokens: 'tokens.json',
  decisions: 'adr.json',
  docs: 'docs.json',
};
