// Serveur MCP du design system en stdio. stdout est réservé au protocole : journaux sur stderr.
// `--self-test` : charge les données, appelle chaque outil par un transport en mémoire, sort à 0.
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { URL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { analyze, RULE_IDS } from '@paulperigault/guards/design';
import { loadData } from '../src/infrastructure/data.ts';
import type { Data } from '../src/domain/types.ts';
import { createServer } from '../src/infrastructure/server.ts';
import type { ServerDeps } from '../src/infrastructure/server.ts';

export const log = (message: string): void => void process.stderr.write(`pp-mcp : ${message}\n`);

function readVersion(): string {
  const manifest: unknown = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  );
  const version =
    typeof manifest === 'object' && manifest !== null && 'version' in manifest
      ? manifest.version
      : undefined;
  return typeof version === 'string' ? version : '0.0.0';
}

/** Un exemple valide par outil ; `get_component` prend le premier composant embarqué. */
const examples = (data: Data): Record<string, Record<string, unknown>> => ({
  list_components: {},
  get_component: { slug: data.components[0]?.slug ?? 'button' },
  get_tokens: { role: 'color', theme: 'light' },
  check_contrast: { foreground: '--pp-color-fg', background: '--pp-color-bg' },
  validate_snippet: { language: 'css', code: '.carte { color: #ff0000; }' },
  search_docs: { query: 'contraste' },
  get_decision: { id: 'ADR-0003' },
});

/** Texte du premier bloc d'une réponse d'outil. */
function firstText(content: unknown): string {
  const first: unknown = Array.isArray(content) ? content[0] : undefined;
  const text = typeof first === 'object' && first !== null && 'text' in first ? first.text : '';
  return typeof text === 'string' && text !== '' ? text : 'erreur';
}

async function selfTest(deps: ServerDeps, version: string): Promise<void> {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer(deps).connect(serverSide);
  const client = new Client({ name: 'pp-mcp-self-test', version });
  await client.connect(clientSide);
  const { tools } = await client.listTools();
  const calls = Object.entries(examples(deps.data));
  const missing = calls.filter(([name]) => !tools.some((tool) => tool.name === name));
  if (missing.length > 0) throw new Error(`outils absents : ${missing.map(([n]) => n).join(', ')}`);
  for (const [name, args] of calls) {
    const result = await client.callTool({ name, arguments: args });
    if (result.isError) throw new Error(`${name} : ${firstText(result.content)}`);
  }
  await client.close();
}

export async function main(argv: string[]): Promise<void> {
  const version = readVersion();
  const deps: ServerDeps = {
    data: loadData(),
    analyze,
    ruleIds: RULE_IDS,
    version,
    onError: (error) => log(String(error)),
  };
  if (argv.includes('--self-test')) {
    await selfTest(deps, version);
    log('ok');
    return;
  }
  await createServer(deps).connect(new StdioServerTransport());
  log(`prêt (stdio, version ${version}, lecture seule)`);
}
