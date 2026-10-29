// Embarque la version compilée de `@paulperigault/tokens` dans `dist/vendor/tokens/` et réécrit les
// spécificateurs `@paulperigault/tokens/...` de `dist/` en chemins relatifs : `create` publié n'a
// aucune dépendance d'exécution (#151, D-056). À lancer après `tsc`, `tokens` compilé avant.
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

const DIST = 'dist';
const VENDOR = join(DIST, 'vendor', 'tokens');
const TOKENS_DIST = join('..', 'tokens', 'dist');
const TOKENS_JSON = join('..', 'tokens', 'generated', 'tokens.json');

/** Spécificateur de paquet → fichier embarqué (relatif à `VENDOR`). */
const TARGETS: Record<string, string> = {
  '@paulperigault/tokens/color': 'lib/color.js',
  '@paulperigault/tokens/customize': 'customize/index.js',
  '@paulperigault/tokens/tokens.json': 'tokens.json',
};

const filesOf = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesOf(path) : [path];
  });

const relativeSpecifier = (from: string, target: string): string => {
  const path = relative(dirname(from), join(VENDOR, target)).split(sep).join('/');
  return path.startsWith('.') ? path : `./${path}`;
};

function rewrite(file: string): void {
  let text = readFileSync(file, 'utf8');
  for (const [specifier, target] of Object.entries(TARGETS)) {
    text = text.replaceAll(`'${specifier}'`, `'${relativeSpecifier(file, target)}'`);
  }
  writeFileSync(file, text);
}

if (!existsSync(TOKENS_DIST)) {
  throw new Error('vendor-tokens : compiler @paulperigault/tokens d’abord (npm -w … run build)');
}
cpSync(TOKENS_DIST, VENDOR, { recursive: true });
cpSync(TOKENS_JSON, join(VENDOR, 'tokens.json'));
const ours = filesOf(DIST).filter(
  (file) => !file.startsWith(VENDOR) && (file.endsWith('.js') || file.endsWith('.d.ts')),
);
for (const file of ours) rewrite(file);
console.log(`vendor-tokens : ${ours.length} fichiers réécrits, tokens embarqué dans ${VENDOR}`);
