#!/usr/bin/env node
import process from 'node:process';
import { log, main } from './cli.ts';

const ARGV_START = 2;

main(process.argv.slice(ARGV_START)).catch((error: unknown) => {
  log(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
