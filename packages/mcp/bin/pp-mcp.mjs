#!/usr/bin/env node
import process from 'node:process';
import { log, main } from './cli.ts';

main(process.argv.slice(2)).catch((error) => {
  log(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
