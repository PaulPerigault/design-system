// Schémas d'entrée des outils (zod, `.strict()` : toute clé inconnue est refusée), vérifiés contre
// les types du domaine. Les longueurs maximales bornent le travail fait par appel.
import { z } from 'zod';
import type { ToolInputs, ToolName } from '../domain/tool-inputs.ts';

export const LIMITS = Object.freeze({
  text: 20_000,
  id: 64,
  query: 200,
  results: 20,
});

const SLUG = /^[a-z0-9-]+$/;
// Sans drapeau `i` : le motif est publié tel quel dans le JSON Schema de l'outil.
const COLOR = /^(?:#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|oklch\([0-9a-zA-Z.%\s]+\)|--pp-[a-z0-9-]+)$/;
const DECISION_ID = /^(?:(?:ADR|adr)-[0-9]{1,4}|[Dd]-[0-9]{1,3})$/;

const slug = () => z.string().min(1).max(LIMITS.id).regex(SLUG, 'attendu : ^[a-z0-9-]+$');
const theme = () => z.enum(['light', 'dark']);
const color = () =>
  z
    .string()
    .trim()
    .min(1)
    .max(LIMITS.id)
    .regex(COLOR, 'attendu : #rgb, #rrggbb, oklch(…) ou un jeton --pp-…');
const query = () => z.string().trim().min(1).max(LIMITS.query);

export const schemas: { [N in ToolName]: z.ZodType<ToolInputs[N]> } = Object.freeze({
  list_components: z.object({ group: slug().optional() }).strict(),
  get_component: z.object({ slug: slug() }).strict(),
  get_tokens: z.object({ role: slug().optional(), theme: theme().optional() }).strict(),
  check_contrast: z
    .object({ foreground: color(), background: color(), theme: theme().optional() })
    .strict(),
  validate_snippet: z
    .object({
      language: z.enum(['astro', 'html', 'css', 'md']),
      code: z.string().min(1).max(LIMITS.text),
    })
    .strict(),
  search_docs: z
    .object({ query: query(), limit: z.number().int().min(1).max(LIMITS.results).optional() })
    .strict(),
  get_decision: z
    .object({
      id: z.string().max(LIMITS.id).regex(DECISION_ID, 'attendu : ADR-0002 ou D-021').optional(),
      query: query().optional(),
    })
    .strict()
    .refine((input) => (input.id === undefined) !== (input.query === undefined), {
      message: 'fournir soit « id », soit « query »',
    }),
});
