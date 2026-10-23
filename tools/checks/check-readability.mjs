// Avertissements de lisibilité sur les pages de la documentation. Code de sortie 0 (avertir ne
// bloque pas) ; `--strict` rend les avertissements bloquants.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { adviseSource } from './readability.mjs';
import { walk } from './walk.mjs';

const ROOT = 'apps/docs/src/pages';

export function run(root = process.cwd(), read = (file) => readFileSync(file, 'utf8')) {
  const dir = join(root, ROOT);
  if (!existsSync(dir)) return [];
  return walk(dir, ['.astro']).flatMap((file) =>
    adviseSource(read(file)).map((advice) => ({ file, ...advice })),
  );
}

if (import.meta.main) {
  const warnings = run();
  for (const { file, detail, sentence } of warnings)
    console.warn(`${file}: ${detail}\n  ${sentence.slice(0, 120)}`);
  console.warn(`check-readability : ${warnings.length} avertissement(s)`);
  process.exit(process.argv.includes('--strict') && warnings.length > 0 ? 1 : 0);
}
