// Règles de contenu d'un tarball npm (sortie de `npm pack --json`). Bloquant : un fichier interdit.
// Avertissement : un manque que le job de build suffit parfois à expliquer (README, LICENSE, wasm).
const FORBIDDEN = [
  [/(^|\/)\.env(\.|$)/, 'fichier d’environnement'],
  [/\.(pem|key|p12|pfx)$|(^|\/)id_(rsa|ed25519)/, 'clé ou certificat'],
  [/(^|\/)\.(npmrc|git)/, 'configuration locale ou dépôt Git'],
  [/(^|\/)node_modules\//, 'dossier node_modules'],
  [/(^|\/)test\/|\.(test|spec)\.[cm]?[jt]s$/, 'fichier de test'],
];
/** Paquets qui publient des sources `.ts` par conception : composants Astro et leurs comportements. */
const SOURCE_TS = new Set(['@paulperigault/astro']);
const isSource = (path) => /\.ts$/.test(path) && !/\.d\.ts$/.test(path);
const inTemplates = (path) => path.startsWith('templates/');

/** @returns {string | undefined} raison d'interdire ce fichier dans ce paquet */
export function forbiddenReason(path, name) {
  const hit = FORBIDDEN.find(([pattern]) => pattern.test(path));
  if (hit) return hit[1];
  if (isSource(path) && !SOURCE_TS.has(name) && !inTemplates(path)) return 'source TypeScript';
  if (/(^|\/)tsconfig[^/]*\.json$/.test(path) && !inTemplates(path)) return 'tsconfig du dépôt';
  return undefined;
}

/** @returns {{ level: 'blocking' | 'warning', message: string }[]} problèmes d'une entrée de `npm pack --json` */
export function tarballProblems(entry, { wasm = false } = {}) {
  const paths = entry.files.map((file) => file.path);
  const problems = paths.flatMap((path) => {
    const reason = forbiddenReason(path, entry.name);
    return reason ? [{ level: 'blocking', message: `${path} : ${reason}` }] : [];
  });
  const missing = (file) => !paths.some((path) => path.toUpperCase() === file);
  if (missing('README.MD')) problems.push({ level: 'warning', message: 'README.md absent' });
  if (missing('LICENSE')) problems.push({ level: 'warning', message: 'LICENSE absent' });
  if (wasm && !paths.some((path) => path.endsWith('.wasm')))
    problems.push({ level: 'warning', message: '.wasm absent (attendu après build:wasm)' });
  return problems;
}
