// Un outil du point de vue des cas d'usage : nom, titre, description et traitement typé. Le
// schéma d'entrée (zod) appartient à l'infrastructure, qui valide avant d'appeler `run`.
import type { ToolInputs, ToolName } from '../domain/tool-inputs.ts';

export type { ToolName };

export interface Tool<N extends ToolName = ToolName> {
  name: N;
  title: string;
  description: string;
  // Syntaxe de méthode : un outil précis reste assignable à `Tool` (paramètre bivariant).
  run(input: ToolInputs[N]): unknown;
}

/** Fixe le type d'entrée de `run` d'après le nom de l'outil. */
export const defineTool = <N extends ToolName>(tool: Tool<N>): Tool<N> => tool;
