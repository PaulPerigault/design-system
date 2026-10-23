#!/usr/bin/env node
// Serveur MCP du design system en stdio. stdout est réservé au protocole : journaux sur stderr.
// `--self-test` : charge les données, appelle chaque outil par un transport en mémoire, sort à 0.
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { URL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { analyze, RULE_IDS } from '@paulperigault/guards/design';
import { loadData } from '../src/data.mjs';
import { createServer } from '../src/server.mjs';

const log = (message) => process.stderr.write(`pp-mcp : ${message}\n`);
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

/** Un exemple valide par outil ; `get_component` prend le premier composant embarqué. */
const examples = (data) => ({
  list_components: {},
  get_component: { slug: data.components[0]?.slug ?? 'button' },
  get_tokens: { role: 'color', theme: 'light' },
  check_contrast: { foreground: '--pp-color-fg', background: '--pp-color-bg' },
  validate_snippet: { language: 'css', code: '.carte { color: #ff0000; }' },
  search_docs: { query: 'contraste' },
  get_decision: { id: 'ADR-0003' },
});

async function selfTest(deps) {
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
    if (result.isError) throw new Error(`${name} : ${result.content[0]?.text ?? 'erreur'}`);
  }
  await client.close();
}

async function main(argv) {
  const data = loadData();
  const deps = { data, analyze, ruleIds: RULE_IDS, version, onError: (e) => log(String(e)) };
  if (argv.includes('--self-test')) {
    await selfTest(deps);
    log('ok');
    return;
  }
  await createServer(deps).connect(new StdioServerTransport());
  log(`prêt (stdio, version ${version}, lecture seule)`);
}

main(process.argv.slice(2)).catch((error) => {
  log(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
