import type { DirEntry, GuardIo } from './io.ts';
import { normalizePath } from './paths.ts';

export const SKIPPED_DIRS = [
  'node_modules',
  'dist',
  '.astro',
  '.git',
  'coverage',
  'test-results',
  'playwright-report',
];

const join = (dir: string, name: string): string =>
  dir === '.' || dir === '' ? name : `${dir}/${name}`;

const hasExtension = (path: string, extensions: string[]): boolean => {
  const lower = path.toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext.toLowerCase()));
};

interface WalkOptions {
  extensions: string[];
  skip: readonly string[];
}

function walk(io: GuardIo, dir: string, options: WalkOptions, found: Set<string>): void {
  for (const entry of io.readdir(dir)) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!options.skip.includes(entry.name)) walk(io, path, options, found);
    } else if (hasExtension(path, options.extensions)) {
      found.add(path);
    }
  }
}

export function listFiles(
  io: GuardIo,
  roots: string[],
  options: { extensions: string[]; skip?: readonly string[] },
): string[] {
  const skip = options.skip ?? SKIPPED_DIRS;
  const found = new Set<string>();
  for (const raw of roots) {
    const root = normalizePath(raw);
    if (!io.exists(root)) continue;
    const children = tryReaddir(io, root);
    if (children === null) {
      if (hasExtension(root, options.extensions)) found.add(root);
    } else {
      walk(io, root, { extensions: options.extensions, skip }, found);
    }
  }
  return [...found].sort();
}

function tryReaddir(io: GuardIo, path: string): DirEntry[] | null {
  try {
    return io.readdir(path);
  } catch {
    return null;
  }
}

export function lineOf(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === '\n') line += 1;
  }
  return line;
}
