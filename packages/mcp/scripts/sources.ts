// Formes attendues des sources lues par `build-data.ts` : validées à la lecture (frontière), pour
// que le reste du script ne manipule que des types connus.
import { z } from 'zod';

const text = z.string();
const colorValue = z.object({ oklch: text, hex: text });
const themeTokens = z.record(text, colorValue);

/** Registre des composants (`packages/astro/registry/registry.json`) : ce que le script lit. */
export const registrySchema = z.object({
  items: z.array(
    z.object({
      name: text,
      files: z.array(z.object({ path: text })).optional(),
      meta: z.object({ tokens: z.array(text).optional() }).optional(),
    }),
  ),
});

/** Jetons générés (`packages/tokens/generated/tokens.json`). */
export const generatedTokensSchema = z.object({
  themes: z.object({ light: themeTokens, dark: themeTokens }),
  base: z.record(text, text),
});

/** Paires de contraste (`packages/tokens/src/roles.json`). */
export const rolesSchema = z.object({
  pairs: z.array(z.object({ fg: text, bg: text, min: z.number(), norm: text })),
});

export type RegistryItem = z.infer<typeof registrySchema>['items'][number];

const GROUP = /\/src\/([^/]+)\//;

// Groupe : dossier du composant sous `src/` (layout, forms…).
export const groupOf = (item?: RegistryItem): string =>
  GROUP.exec(item?.files?.[0]?.path ?? '')?.[1] ?? 'autre';
