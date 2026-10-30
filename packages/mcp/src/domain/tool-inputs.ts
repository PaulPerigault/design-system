// Entrée de chaque outil, une fois validée à la frontière (les schémas zod sont en infrastructure).
import type { Language } from './snippet.ts';
import type { Theme } from './types.ts';

export interface ToolInputs {
  list_components: { group?: string | undefined };
  get_component: { slug: string };
  get_tokens: { role?: string | undefined; theme?: Theme | undefined };
  check_contrast: { foreground: string; background: string; theme?: Theme | undefined };
  validate_snippet: { language: Language; code: string };
  search_docs: { query: string; limit?: number | undefined };
  get_decision: { id?: string | undefined; query?: string | undefined };
}

export type ToolName = keyof ToolInputs;
