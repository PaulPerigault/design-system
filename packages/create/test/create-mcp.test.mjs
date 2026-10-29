import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { run } from '../src/commands/create.ts';
import { nodeIo } from '../src/lib/io.ts';
import { loadTemplate } from '../src/site/template.ts';
import { fakeIo } from './fake-io.mjs';

const TEMPLATES = fileURLToPath(new URL('../templates', import.meta.url));
const sink = { write: () => true };
const template = loadTemplate(nodeIo({ cwd: TEMPLATES, stdout: sink, stderr: sink }), TEMPLATES);
const content = (path) => template.files.find((file) => file.path === path).content;
const CONFIGS = ['_mcp.json', '_kiro/settings/mcp.json', '_cursor/mcp.json'];

describe('create : assistants IA', () => {
  it('les trois configurations MCP sont du JSON valide qui désigne pp-mcp', () => {
    for (const path of CONFIGS) {
      const server = JSON.parse(content(path)).mcpServers['pp-ds'];
      expect(server).toMatchObject({ command: 'npx', args: ['--no-install', 'pp-mcp'] });
    }
    expect(JSON.parse(content('_kiro/settings/mcp.json')).mcpServers['pp-ds'].disabled).toBe(false);
  });

  it('le site généré écrit les configurations, AGENTS.md et la dépendance', () => {
    const fake = fakeIo({});
    expect(run({ positionals: ['mon-site'] }, { io: fake.io, template })).toBe(0);
    const at = (rel) => fake.files[`/projet/mon-site/${rel}`];
    for (const rel of ['.mcp.json', '.kiro/settings/mcp.json', '.cursor/mcp.json', 'AGENTS.md']) {
      expect(at(rel), rel).toBeDefined();
    }
    expect(JSON.parse(at('package.json')).devDependencies).toHaveProperty('@paulperigault/mcp');
    expect(at('AGENTS.md')).toContain('pp-ds');
  });
});
