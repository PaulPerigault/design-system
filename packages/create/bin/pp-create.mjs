#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { main } from '../src/cli.mjs';
import { nodeIo } from '../src/lib/io.mjs';

const CODE_CRASH = 1;

try {
  const { stdout, stderr } = process;
  const io = nodeIo({ cwd: process.cwd(), stdout, stderr });
  const templatesRoot = fileURLToPath(new URL('../templates', import.meta.url));
  const manifest = readFileSync(new URL('../package.json', import.meta.url), 'utf8');
  const { version } = JSON.parse(manifest);
  process.exitCode = main(process.argv.slice(2), { io, templatesRoot, version });
} catch (error) {
  process.stderr.write(`pp-create : ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = CODE_CRASH;
}
