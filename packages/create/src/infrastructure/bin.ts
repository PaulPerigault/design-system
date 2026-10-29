#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { main } from '../application/cli.ts';
import { messageOf } from '../domain/snippet.ts';
import { nodeIo } from './node-io.ts';
import { buildTheme } from './theme.ts';

const CODE_CRASH = 1;
const ARGV_START = 2;

try {
  const { stdout, stderr } = process;
  const io = nodeIo({ cwd: process.cwd(), stdout, stderr });
  const templatesRoot = fileURLToPath(new URL('../../templates', import.meta.url));
  const manifest: unknown = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
  );
  const version =
    typeof manifest === 'object' && manifest !== null && 'version' in manifest
      ? manifest.version
      : undefined;
  process.exitCode = main(process.argv.slice(ARGV_START), {
    io,
    templatesRoot,
    theme: buildTheme,
    version: typeof version === 'string' ? version : '0.0.0',
  });
} catch (error) {
  process.stderr.write(`pp-create : ${messageOf(error)}\n`);
  process.exitCode = CODE_CRASH;
}
