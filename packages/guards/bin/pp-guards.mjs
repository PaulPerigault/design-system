#!/usr/bin/env node
import process from 'node:process';
import { main } from '../src/cli.ts';
import { nodeIo } from '../src/lib/io.ts';

process.exitCode = main(process.argv.slice(2), nodeIo(process));
