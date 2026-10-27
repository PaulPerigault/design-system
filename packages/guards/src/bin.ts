#!/usr/bin/env node
import process from 'node:process';
import { main } from './cli.ts';
import { nodeIo } from './lib/io.ts';

const ARGV_START = 2;

process.exitCode = main(process.argv.slice(ARGV_START), nodeIo(process));
