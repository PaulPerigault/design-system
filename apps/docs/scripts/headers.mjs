/** CLI : écrit `_headers`, `_redirects` et les configurations d'hébergement (après `astro build`). */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';
import { run } from './headers/run.mjs';

const ARGV_START = 2;

const fsIo = {
  list: (dir) => readdirSync(dir, { recursive: true }).map((p) => p.split(sep).join('/')),
  read: (path) => readFileSync(path, 'utf8'),
  write: (path, text) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  },
};

/** @param {string[]} argv */
export function parseOptions(argv) {
  const { values } = parseArgs({
    args: argv,
    options: { dist: { type: 'string' }, deploy: { type: 'string' } },
  });
  const dist = resolve(values.dist ?? join(import.meta.dirname, '..', 'dist'));
  return { dist, deploy: values.deploy ? resolve(values.deploy) : undefined };
}

if (import.meta.main) {
  run({ ...parseOptions(process.argv.slice(ARGV_START)), ...fsIo, out: process.stdout });
}
