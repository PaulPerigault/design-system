#!/usr/bin/env node
import process from 'node:process';
import { main } from '../src/cli.mjs';
import { nodeIo } from '../src/lib/io.mjs';

process.exitCode = main(process.argv.slice(2), nodeIo(process));
