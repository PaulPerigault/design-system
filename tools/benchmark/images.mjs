// Mesure du pipeline d'images (#91) : variantes produites par le build de la documentation, leur
// poids par format et, avec `--build`, la durée d'un build à froid puis à chaud. Affiche, ne bloque
// jamais : le code de sortie est toujours 0.
//   node tools/benchmark/images.mjs [dossier=apps/docs/dist/_astro] [--build]
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { percent, ratio, summarize, table, widthsFrom } from './images-core.mjs';

const BUILD = ['-w', '@paulperigault/docs', 'run', 'build'];
const CACHE = 'node_modules/.astro/assets';
const NS_PER_S = 1e9;

const walk = (dir, extension) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path, extension);
    return path.endsWith(extension) ? [path] : [];
  });

/** Fichiers de l'image pipeline : `{ name, bytes }`. */
const imageFiles = (dir) =>
  readdirSync(dir).map((name) => ({ name, bytes: statSync(join(dir, name)).size }));

/** Largeurs lues dans tous les `.html` du site construit (le dossier parent de `_astro`). */
function widthsOf(root) {
  const widths = new Map();
  for (const file of walk(root, '.html')) {
    for (const [name, width] of widthsFrom(readFileSync(file, 'utf8'))) widths.set(name, width);
  }
  return widths;
}

function timedBuild() {
  const start = process.hrtime.bigint();
  // Arguments constants ; `shell` seulement sous Windows, où npm est un script `.cmd`.
  execFileSync('npm', BUILD, { stdio: 'ignore', shell: process.platform === 'win32' });
  return Number(process.hrtime.bigint() - start) / NS_PER_S;
}

/** Durée d'un build sans cache d'images, puis avec le cache chaud (en secondes). */
function buildDurations() {
  rmSync(CACHE, { recursive: true, force: true });
  return { cold: timedBuild(), warm: timedBuild() };
}

function report(dir, withBuild) {
  const files = imageFiles(dir);
  const widths = widthsOf(join(dir, '..'));
  const lines = [
    `Pipeline d'images, ${dir} (${new Date().toISOString().slice(0, 10)})`,
    '',
    table(summarize(files)),
    '',
  ];
  for (const [a, b] of [
    ['avif', 'webp'],
    ['avif', 'repli'],
    ['webp', 'repli'],
  ]) {
    const { pairs, median } = ratio(files, widths, a, b);
    lines.push(`- ${a} / ${b} à même largeur : médiane ${percent(median)} (${pairs} paires)`);
  }
  if (withBuild) {
    const { cold, warm } = buildDurations();
    lines.push(
      `- build de la documentation : ${cold.toFixed(1)} s à froid, ${warm.toFixed(1)} s à chaud`,
    );
  }
  return lines.join('\n');
}

if (import.meta.main) {
  const dir = process.argv.slice(2).find((arg) => !arg.startsWith('--')) ?? 'apps/docs/dist/_astro';
  const text = existsSync(dir)
    ? report(dir, process.argv.includes('--build'))
    : `${dir} absent : construire la documentation d'abord (npm -w @paulperigault/docs run build).`;
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
}
