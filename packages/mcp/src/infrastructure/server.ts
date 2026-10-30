// Assemblage du serveur MCP : sept outils en lecture seule, dépendances injectées (données,
// analyse). Aucun transport ici : le binaire choisit stdio, le self-test un transport en mémoire.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { toolCallback } from '../application/tool-callback.ts';
import type { Tool } from '../application/tool.ts';
import { toolList } from '../application/tools.ts';
import type { ToolDeps } from '../application/tools.ts';
import { schemas } from './tool-schemas.ts';

export const SERVER_NAME = 'paulperigault-ds';
const ANNOTATIONS = Object.freeze({
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
});

export interface ServerDeps extends ToolDeps {
  version?: string;
  onError?: (error: unknown) => void;
}

/** Valide l'entrée avec le schéma de l'outil, puis appelle son traitement typé. */
const validated = (tool: Tool) => (input: unknown) => tool.run(schemas[tool.name].parse(input));

export function createServer(deps: ServerDeps): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: deps.version ?? '0.0.0' });
  for (const tool of toolList(deps)) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: schemas[tool.name],
        annotations: { title: tool.title, ...ANNOTATIONS },
      },
      toolCallback(validated(tool), deps.onError),
    );
  }
  return server;
}
