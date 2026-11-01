// Poids des pages et des paquets, estimation carbone (#102). Affiche, ne bloque jamais : sort 0.
//   node tools/benchmark/weight.mjs [dist=apps/docs/dist] [--write apps/docs/src/data/sobriete.json]
import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { SCENARIOS, pageViewGrams } from './carbon.mjs';
import { TYPES, pageWeight, sum } from './weight-core.mjs';

const PAGES = ['/', '/components/button/', '/tableau-de-bord/', '/sobriete/'];
const KIB = 1024;
const MILLI = 1000;
const kib = (bytes) => (bytes / KIB).toFixed(1).replace('.', ',');

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [{ path, bytes: statSync(path).size }];
  });

/** Poids d'un paquet npm (archive et contenu), lu par `npm pack --dry-run --json`. */
export function packages(env = process.env) {
  const args = ['pack', '--dry-run', '--workspaces', '--json'];
  const script = env.npm_execpath;
  const options = {
    encoding: 'utf8',
    stdio: 'pipe',
    shell: !script && process.platform === 'win32',
  };
  const result = script
    ? spawnSync(process.execPath, [script, ...args], options)
    : spawnSync('npm', args, options);
  const start = result.stdout?.indexOf('[') ?? -1;
  if (result.status !== 0 || start < 0) return [];
  return JSON.parse(result.stdout.slice(start))
    .filter(({ name }) => name !== '@paulperigault/docs')
    .map(({ name, size, unpackedSize }) => ({
      name,
      archive: size,
      unpacked: unpackedSize,
    }));
}

export function measureSite(dist) {
  const read = (path) => {
    const file = join(dist, path);
    return existsSync(file) ? readFileSync(file) : null;
  };
  const pages = PAGES.flatMap((path) => {
    const file = join(dist, path, 'index.html');
    if (!existsSync(file)) return [];
    const weight = pageWeight(readFileSync(file, 'utf8'), read);
    const grams = Object.fromEntries(
      Object.entries(SCENARIOS).map(([name, s]) => [name, pageViewGrams(sum(weight, 'brotli'), s)]),
    );
    return [{ path, weight, grams }];
  });
  const files = walk(dist);
  const largest = files.reduce((a, b) => (b.bytes > a.bytes ? b : a));
  return {
    pages,
    files: files.length,
    largest: { path: largest.path.slice(dist.length).replaceAll('\\', '/'), bytes: largest.bytes },
  };
}

export function render({ pages, files, largest }, pkgs) {
  const head = `| Page | ${TYPES.join(' | ')} | Total brotli | CO2e (nouveau visiteur) |`;
  const rows = pages.map(({ path, weight, grams }) => {
    const cells = TYPES.map((type) => `${kib(weight[type].brotli)} Kio`);
    return `| ${path} | ${cells.join(' | ')} | ${kib(sum(weight, 'brotli'))} Kio | ${(grams.newVisitor * MILLI).toFixed(1).replace('.', ',')} mg |`;
  });
  const lines = [head, `|${' --- |'.repeat(TYPES.length + 3)}`, ...rows, ''];
  lines.push(
    `Site : ${files} fichiers ; le plus gros : ${largest.path} (${kib(largest.bytes)} Kio).`,
  );
  for (const { name, archive, unpacked } of pkgs) {
    lines.push(`- ${name} : archive ${kib(archive)} Kio, contenu ${kib(unpacked)} Kio`);
  }
  return lines.join('\n');
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const written = args.indexOf('--write');
  const dist =
    args.find((arg, i) => !arg.startsWith('--') && i !== written + 1) ?? 'apps/docs/dist';
  if (!existsSync(dist)) {
    console.log(`${dist} absent : construire la documentation d'abord.`);
  } else {
    const site = measureSite(dist);
    const pkgs = packages();
    const text = `Poids des pages (octets transférés, brotli), ${new Date().toISOString().slice(0, 10)}\n\n${render(site, pkgs)}`;
    console.log(text);
    if (process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
    if (written >= 0) {
      const date = new Date().toISOString().slice(0, 10);
      writeFileSync(
        args[written + 1],
        `${JSON.stringify({ date, ...site, packages: pkgs }, null, 2)}\n`,
      );
    }
  }
}
